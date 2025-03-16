const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Post = require('../models/post.model');

router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/recommended', auth, async (req, res) => {
    try {
        const currentUserId = req.user.id;


        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }


        const excludeIds = [...currentUser.following.map(id => id.toString()), currentUserId];


        const recommendedUsers = await User.find({
            _id: { $nin: excludeIds }
        }).limit(5).select('-password');

        res.status(200).json(recommendedUsers);
    } catch (error) {
        console.error('Error getting recommended users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { name, username, bio } = req.body;

        if (username) {
            const existingUser = await User.findOne({
                username,
                _id: { $ne: req.user.id }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }

        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (username) user.username = username;
        if (bio) user.bio = bio;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            bio: user.bio,
            followers: user.followers,
            following: user.following
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.put('/profile/image', auth, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImage: imageUrl },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error('Profile image update error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.put('/profile/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/follow/:userId', auth, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.userId);
        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = await User.findById(req.user.id);

        if (currentUser.following.includes(req.params.userId)) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        await User.findByIdAndUpdate(req.user.id, {
            $push: { following: req.params.userId }
        });

        await User.findByIdAndUpdate(req.params.userId, {
            $push: { followers: req.user.id }
        });

        res.status(200).json({ message: 'Successfully followed user' });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/unfollow/:userId', auth, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.userId);
        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndUpdate(req.user.id, {
            $pull: { following: req.params.userId }
        });

        await User.findByIdAndUpdate(req.params.userId, {
            $pull: { followers: req.user.id }
        });

        res.status(200).json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/is-following/:userId', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const isFollowing = currentUser.following.includes(req.params.userId);
        res.status(200).json({ following: isFollowing });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/followers', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const followers = await User.find({
            _id: { $in: currentUser.followers }
        }).select('-password');

        res.status(200).json(followers);
    } catch (error) {
        console.error('Error getting followers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/following', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const following = await User.find({
            _id: { $in: currentUser.following }
        }).select('-password');

        res.status(200).json(following);
    } catch (error) {
        console.error('Error getting following:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/otherprofile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const postCount = await Post.countDocuments({ user: user._id });
        const followersCount = await User.countDocuments({ following: user._id });
        const followingCount = await User.countDocuments({ followers: user._id });

        const userWithCounts = {
            ...user.toObject(),
            postCount,
            followers: followersCount,
            following: followingCount
        };

        res.status(200).json(userWithCounts);
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/search', auth, async (req, res) => {
  try {
    const searchQuery = req.query.username;

    if (!searchQuery) {
      const users = await User.find({ _id: { $ne: req.user.id } })
        .select('-password')
        .limit(3);
      
      return res.status(200).json(users);
    }
    
    const searchRegex = new RegExp(searchQuery, 'i');
    
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { name: searchRegex }
      ],
      _id: { $ne: req.user.id }
    })
    .select('-password')
    .limit(5);
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }


        const postCount = await Post.countDocuments({ user: user._id });
        const followersCount = await User.countDocuments({ following: user._id });
        const followingCount = await User.countDocuments({ followers: user._id });

        const userWithCounts = {
            ...user.toObject(),
            postCount,
            followers: followersCount,
            following: followingCount
        };

        res.status(200).json(userWithCounts);
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/user/:userId', auth, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('user', 'name username profileImage');

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error getting user posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/check-follow/:userId', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const isFollowing = currentUser.following.includes(req.params.userId);

        res.status(200).json({ isFollowing });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:userId/followers', auth, async (req, res) => {
  try {

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followers = await User.find({
      following: { $in: [req.params.userId] }
    }).select('-password');

    res.status(200).json(followers);
  } catch (error) {
    console.error('Error getting followers for specific user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:userId/following', auth, async (req, res) => {
  try {

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const following = await User.find({
      _id: { $in: user.following }
    }).select('-password');

    res.status(200).json(following);
  } catch (error) {
    console.error('Error getting following for specific user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;