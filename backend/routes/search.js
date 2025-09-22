const express = require('express');
const { query, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search
// @desc    Search posts and users
// @access  Public
router.get('/', [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must not be empty'),
  query('type')
    .optional()
    .isIn(['posts', 'users', 'all'])
    .withMessage('Type must be posts, users, or all'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('tag')
    .optional()
    .trim(),
  query('sort')
    .optional()
    .isIn(['relevance', 'newest', 'oldest', 'popular'])
    .withMessage('Invalid sort option')
], optionalAuth, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      q: searchQuery,
      type = 'all',
      page = 1,
      limit = 10,
      tag,
      sort = 'relevance'
    } = req.query;

    const skip = (page - 1) * limit;
    const results = {
      posts: [],
      users: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 0,
        totalResults: 0,
        hasNext: false,
        hasPrev: false
      }
    };

    // Search posts
    if (type === 'posts' || type === 'all') {
      let postQuery = { isPublished: true };

      // Add search query
      if (searchQuery) {
        postQuery.$text = { $search: searchQuery };
      }

      // Add tag filter
      if (tag) {
        postQuery.tags = { $in: [tag.toLowerCase()] };
      }

      // Build sort
      let postSort = {};
      switch (sort) {
        case 'newest':
          postSort = { createdAt: -1 };
          break;
        case 'oldest':
          postSort = { createdAt: 1 };
          break;
        case 'popular':
          postSort = { views: -1, likes: -1 };
          break;
        case 'relevance':
        default:
          if (searchQuery) {
            postSort = { score: { $meta: 'textScore' } };
          } else {
            postSort = { createdAt: -1 };
          }
          break;
      }

      const posts = await Post.find(postQuery)
        .populate('author', 'name avatar')
        .sort(postSort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add like and bookmark status for authenticated users
      if (req.user) {
        posts.forEach(post => {
          post.isLiked = post.likes.some(like => like.toString() === req.user._id.toString());
          post.isBookmarked = post.bookmarks.some(bookmark => bookmark.toString() === req.user._id.toString());
        });
      }

      results.posts = posts;
    }

    // Search users
    if (type === 'users' || type === 'all') {
      let userQuery = {};

      if (searchQuery) {
        userQuery.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      const users = await User.find(userQuery)
        .select('name avatar bio followerCount')
        .sort({ followerCount: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      results.users = users;
    }

    // Get total counts for pagination
    if (type === 'posts' || type === 'all') {
      let postCountQuery = { isPublished: true };
      if (searchQuery) {
        postCountQuery.$text = { $search: searchQuery };
      }
      if (tag) {
        postCountQuery.tags = { $in: [tag.toLowerCase()] };
      }
      const postCount = await Post.countDocuments(postCountQuery);
      results.pagination.totalResults += postCount;
    }

    if (type === 'users' || type === 'all') {
      let userCountQuery = {};
      if (searchQuery) {
        userCountQuery.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { bio: { $regex: searchQuery, $options: 'i' } }
        ];
      }
      const userCount = await User.countDocuments(userCountQuery);
      results.pagination.totalResults += userCount;
    }

    // Calculate pagination
    results.pagination.totalPages = Math.ceil(results.pagination.totalResults / limit);
    results.pagination.hasNext = page < results.pagination.totalPages;
    results.pagination.hasPrev = page > 1;

    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during search'
    });
  }
});

// @route   GET /api/search/tags
// @desc    Get popular tags
// @access  Public
router.get('/tags', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Aggregate to get tag counts
    const tagCounts = await Post.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    const tags = tagCounts.map(tag => ({
      name: tag._id,
      count: tag.count
    }));

    res.json({
      status: 'success',
      data: { tags }
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting tags'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.json({
        status: 'success',
        data: { suggestions: [] }
      });
    }

    const suggestions = [];

    // Get post title suggestions
    const postSuggestions = await Post.find({
      title: { $regex: query, $options: 'i' },
      isPublished: true
    })
      .select('title')
      .limit(5)
      .lean();

    suggestions.push(...postSuggestions.map(post => ({
      type: 'post',
      text: post.title
    })));

    // Get tag suggestions
    const tagSuggestions = await Post.distinct('tags', {
      tags: { $regex: query, $options: 'i' },
      isPublished: true
    });

    suggestions.push(...tagSuggestions.slice(0, 5).map(tag => ({
      type: 'tag',
      text: tag
    })));

    // Get user suggestions
    const userSuggestions = await User.find({
      name: { $regex: query, $options: 'i' }
    })
      .select('name')
      .limit(3)
      .lean();

    suggestions.push(...userSuggestions.map(user => ({
      type: 'user',
      text: user.name
    })));

    res.json({
      status: 'success',
      data: { suggestions: suggestions.slice(0, 10) }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting suggestions'
    });
  }
});

module.exports = router;

