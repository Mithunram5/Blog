const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect, optionalAuth, checkPostOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts with pagination and filtering
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('tag').optional().trim(),
  query('author').optional().isMongoId().withMessage('Invalid author ID'),
  query('sort').optional().isIn(['newest', 'oldest', 'popular', 'trending']).withMessage('Invalid sort option')
], optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { tag, author, sort } = req.query;

    // Build query
    let query = { isPublished: true };

    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    if (author) {
      query.author = author;
    }

    // Build sort
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1, likes: -1 };
        break;
      case 'trending':
        // Trending: recent posts with high engagement
        sortOption = { 
          $expr: { 
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] },
              { $multiply: [{ $size: '$bookmarks' }, 1] },
              { $multiply: ['$views', 0.1] }
            ]
          }
        };
        break;
    }

    // Get posts with pagination
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // Add like and bookmark status for authenticated users
    if (req.user) {
      posts.forEach(post => {
        post.isLiked = post.likes.some(like => like.toString() === req.user._id.toString());
        post.isBookmarked = post.bookmarks.some(bookmark => bookmark.toString() === req.user._id.toString());
      });
    }

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting posts'
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar bio followerCount')
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    // Add like and bookmark status for authenticated users
    if (req.user) {
      post.isLiked = post.likes.some(like => like.toString() === req.user._id.toString());
      post.isBookmarked = post.bookmarks.some(bookmark => bookmark.toString() === req.user._id.toString());
    }

    res.json({
      status: 'success',
      data: { post }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting post'
    });
  }
});

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('excerpt')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Excerpt must be between 10 and 500 characters'),
  body('tags')
    .isArray({ min: 1 })
    .withMessage('At least one tag is required'),
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters')
], async (req, res) => {
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

    const { title, content, excerpt, tags, image } = req.body;

    const post = await Post.create({
      title,
      content,
      excerpt,
      tags: tags.map(tag => tag.toLowerCase()),
      image: image || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
      author: req.user._id
    });

    await post.populate('author', 'name avatar');

    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating post'
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (Author only)
router.put('/:id', protect, checkPostOwnership, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Excerpt must be between 10 and 500 characters'),
  body('tags')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one tag is required'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters')
], async (req, res) => {
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

    // Normalize incoming data and support tags as CSV for compatibility
    const { title, content, excerpt, tags, image } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (image !== undefined) updateData.image = image;

    // Accept tags as array or comma-separated string
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updateData.tags = tags.map(tag => String(tag).toLowerCase());
      } else if (typeof tags === 'string') {
        updateData.tags = tags.split(',').map(t => t.trim()).filter(Boolean).map(t => t.toLowerCase());
      } else {
        // ignore invalid tag format (validation should have caught this)
      }
    }

    // Use the post loaded by checkPostOwnership so pre-save hooks run
    const post = req.post;
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }

    // Apply updates and save (runs pre-save middleware)
    Object.keys(updateData).forEach(key => {
      post[key] = updateData[key];
    });

    try {
      await post.save();
      await post.populate('author', 'name avatar');

      res.json({
        status: 'success',
        message: 'Post updated successfully',
        data: { post }
      });
    } catch (saveErr) {
      console.error('Save post error:', saveErr);
      // If validation error, send details
      if (saveErr.name === 'ValidationError') {
        const details = Object.keys(saveErr.errors).map(k => ({ field: k, message: saveErr.errors[k].message }));
        return res.status(400).json({ status: 'error', message: 'Validation failed', errors: details });
      }
      throw saveErr;
    }
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating post'
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (Author only)
router.delete('/:id', protect, checkPostOwnership, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting post'
    });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const isLiked = post.likes.some(like => like.toString() === req.user._id.toString());

    if (isLiked) {
      post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      status: 'success',
      message: isLiked ? 'Post unliked' : 'Post liked',
      data: {
        isLiked: !isLiked,
        likeCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error liking post'
    });
  }
});

// @route   POST /api/posts/:id/bookmark
// @desc    Bookmark/Unbookmark post
// @access  Private
router.post('/:id/bookmark', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const isBookmarked = post.bookmarks.some(bookmark => bookmark.toString() === req.user._id.toString());

    if (isBookmarked) {
      post.bookmarks = post.bookmarks.filter(bookmark => bookmark.toString() !== req.user._id.toString());
    } else {
      post.bookmarks.push(req.user._id);
    }

    await post.save();

    res.json({
      status: 'success',
      message: isBookmarked ? 'Post unbookmarked' : 'Post bookmarked',
      data: {
        isBookmarked: !isBookmarked,
        bookmarkCount: post.bookmarks.length
      }
    });
  } catch (error) {
    console.error('Bookmark post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error bookmarking post'
    });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', protect, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
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

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user._id,
      content: req.body.content
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'name avatar');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: { comment: newComment }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error adding comment'
    });
  }
});

module.exports = router;

