const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const bcrypt = require('bcrypt');

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
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: err.message });
    }
});


router.get('/recommended', async (req, res) => {
    try {

        const users = await User.find()
            .select('-password')
            .limit(3);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, username, bio } = req.body;

        // Check if username is already taken by another user
        if (username) {
            const existingUser = await User.findOne({
                username,
                _id: { $ne: req.user._id }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }

        // Update user fields
        const user = await User.findById(req.user._id);

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
            req.user._id,
            { profileImage: imageUrl },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error('Profile image update error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Change password
router.put('/profile/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password update error:', err);
        res.status(500).json({ message: err.message });
    }
});




module.exports = router;