const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { protect, checkProfileAccess } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/:userId
// @desc    Get user profile by ID
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    console.log('Get user request for:', req.params.userId);
    const user = await User.findById(req.params.userId)
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Safely get public profile — guard against unexpected serialization errors
    let publicProfile;
    try {
      publicProfile = user.getPublicProfile();
    } catch (serErr) {
      console.error('Error serializing user public profile:', serErr);
      // Fallback to a minimal safe profile
      publicProfile = {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        followers: Array.isArray(user.followers) ? user.followers.map(f => (typeof f === 'object' ? { id: f._id, name: f.name, avatar: f.avatar } : f)) : [],
        following: Array.isArray(user.following) ? user.following.map(f => (typeof f === 'object' ? { id: f._id, name: f.name, avatar: f.avatar } : f)) : []
      };
    }

    res.json({
      status: 'success',
      data: {
        user: publicProfile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    const payload = { status: 'error', message: 'Server error getting user' };
    if (process.env.NODE_ENV === 'development') {
      payload.error = error.message;
      payload.stack = error.stack;
    }
    res.status(500).json(payload);
  }
});

// @route   GET /api/users/:userId/posts
// @desc    Get user's posts
// @access  Public
router.get('/:userId/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.params.userId, 
      isPublished: true 
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({ 
      author: req.params.userId, 
      isPublished: true 
    });

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
    console.error('Get user posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting user posts'
    });
  }
});

// @route   POST /api/users/:userId/follow
// @desc    Follow/Unfollow user
// @access  Private
router.post('/:userId/follow', protect, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Can't follow yourself
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.some(
      follow => follow.toString() === targetUserId
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        follow => follow.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        follower => follower.toString() !== currentUserId.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      status: 'success',
      message: isFollowing ? 'User unfollowed' : 'User followed',
      data: {
        isFollowing: !isFollowing,
        followerCount: targetUser.followers.length,
        followingCount: currentUser.following.length
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error following user'
    });
  }
});

// @route   GET /api/users/:userId/followers
// @desc    Get user's followers
// @access  Public
router.get('/:userId/followers', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'name avatar bio followerCount')
      .select('followers');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        followers: user.followers
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting followers'
    });
  }
});

// @route   GET /api/users/:userId/following
// @desc    Get users that this user is following
// @access  Public
router.get('/:userId/following', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'name avatar bio followerCount')
      .select('following');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        following: user.following
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting following'
    });
  }
});

// @route   GET /api/users/:userId/liked-posts
// @desc    Get user's liked posts
// @access  Private (Own profile only)
router.get('/:userId/liked-posts', protect, checkProfileAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      likes: req.params.userId,
      isPublished: true 
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({ 
      likes: req.params.userId,
      isPublished: true 
    });

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
    console.error('Get liked posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting liked posts'
    });
  }
});

// @route   GET /api/users/:userId/bookmarked-posts
// @desc    Get user's bookmarked posts
// @access  Private (Own profile only)
router.get('/:userId/bookmarked-posts', protect, checkProfileAccess, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      bookmarks: req.params.userId,
      isPublished: true 
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({ 
      bookmarks: req.params.userId,
      isPublished: true 
    });

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
    console.error('Get bookmarked posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error getting bookmarked posts'
    });
  }
});

module.exports = router;

