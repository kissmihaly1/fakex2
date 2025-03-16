const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');


router.get('/users', auth, adminAuth, async (req, res) => {
    try {

        const userCount = await User.countDocuments({});

        const activeUserCount = await User.countDocuments({ isDeleted: { $ne: true } });

        const allUsers = await User.find({ isDeleted: { $ne: true } })
            .select('-password')
            .sort({ createdAt: -1 });
        


        
        res.json(allUsers);
    } catch (err) {
        console.error('Error fetching users for admin panel:', err);
        res.status(500).json({ msg: 'Server error while fetching users' });
    }
});
router.put('/users/:userId/ban', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { banDuration } = req.body;
        
        if (!banDuration || isNaN(banDuration)) {
            return res.status(400).json({ msg: 'Valid ban duration required' });
        }
        
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + parseInt(banDuration));
        
        const user = await User.findByIdAndUpdate(
            userId,
            { bannedUntil: banUntil },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        res.json({
            msg: `User banned until ${banUntil.toISOString()}`,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/users/:userId/unban', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { bannedUntil: null },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        res.json({
            msg: 'User unbanned successfully',
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { isDeleted: true },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/posts', auth, adminAuth, async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username profileImage email _id');
        
        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts for admin panel:', err);
        res.status(500).json({ msg: 'Server error while fetching posts' });
    }
});

router.get('/comments', auth, adminAuth, async (req, res) => {
    try {
        const comments = await Comment.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username profileImage email _id')
            .populate('post', 'content');
        
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments for admin panel:', err);
        res.status(500).json({ msg: 'Server error while fetching comments' });
    }
});

router.delete('/comments/:commentId', auth, adminAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        
        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        
        const post = await Post.findById(comment.post);
        
        if (post) {
            post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
            await post.save();
        }
        
        await Comment.findByIdAndDelete(commentId);
        
        res.json({ msg: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/regular-users', auth, adminAuth, async (req, res) => {
    try {

        const allUsers = await User.find({}).select('-password');

        
        const regularUsers = await User.find({ isAdmin: { $ne: true }, isDeleted: { $ne: true } })
            .select('-password')
            .sort({ createdAt: -1 });
        

        const regularUsersAlt = await User.find({
            $or: [
                { isAdmin: false },
                { isAdmin: { $exists: false } },
                { isAdmin: "false" }
            ],
            isDeleted: { $ne: true }
        }).select('-password');
        

        const resultUsers = regularUsersAlt.length > regularUsers.length ? regularUsersAlt : regularUsers;

        
        res.json(resultUsers);
    } catch (err) {
        console.error('Error fetching regular users for admin panel:', err);
        res.status(500).json({ msg: 'Server error while fetching regular users' });
    }
});

module.exports = router; 