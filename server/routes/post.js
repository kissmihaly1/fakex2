const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const User = require('../models/User');
const auth = require('../middleware/auth');


router.get('/', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const posts = await Post.find()
            .populate('user', '-password')
            .populate({
                path: 'originalPost',
                populate: {
                    path: 'user',
                    select: '-password'
                }
            })
            .sort({ createdAt: -1 });

        const formattedPosts = posts.map(post => {
            const isLiked = post.likes.some(like => like.toString() === currentUserId.toString());

            const formattedPost = {
                _id: post._id,
                content: post.content,
                user: post.user,
                createdAt: post.createdAt,
                likes: post.likes.length,
                comments: post.comments.length,
                isLiked: isLiked,
                repostCounter: post.repostCounter || 0
            };

            if (post.isRepost && post.originalPost) {
                formattedPost.isRepost = true;
                formattedPost.originalPost = {
                    _id: post.originalPost._id,
                    content: post.originalPost.content,
                    user: post.originalPost.user,
                    createdAt: post.originalPost.createdAt,
                    repostCounter: post.repostCounter || 0,
                    isLiked: post.originalPost.likes &&
                        post.originalPost.likes.some(like =>
                            like.toString() === currentUserId.toString())
                };
            }

            return formattedPost;
        });

        res.json(formattedPosts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/',auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const post = new Post({
            content: req.body.content,
            user: currentUserId
        });

        const savedPost = await post.save();
        const populatedPost = await Post.findById(savedPost._id).populate('user', '-password');

        res.status(201).json({
            _id: populatedPost._id,
            content: populatedPost.content,
            user: populatedPost.user,
            createdAt: populatedPost.createdAt,
            likes: 0,
            comments: 0,
            isLiked: false
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.user._id;

        const alreadyLiked = post.likes.some(like =>
            like.toString() === userId.toString()
        );

        if (alreadyLiked) {
            post.likes = post.likes.filter(like =>
                like.toString() !== userId.toString()
            );
            await post.save();

            return res.json({
                message: 'Post unliked',
                likes: post.likes.length,
                isLiked: false
            });
        } else {
            post.likes.push(userId);
            await post.save();

            return res.json({
                message: 'Post liked',
                likes: post.likes.length,
                isLiked: true
            });
        }
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/unlike', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.likes = post.likes.filter(id => id !== null && id !== undefined);

        post.likes = post.likes.filter(id => id.toString() !== currentUserId.toString());

        await post.save();

        res.json({
            _id: post._id,
            likes: post.likes.length,
            isLiked: false
        });
    } catch (err) {
        console.error('Unlike error:', err);
        res.status(400).json({
            message: err.message,
            error: err.toString()
        });
    }
});

router.delete('/:id', auth,async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.user.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully', postId: req.params.id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/:id/comments', auth,async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = {
            user: currentUserId,
            content: req.body.content,
            createdAt: new Date()
        };

        post.comments.push(comment);
        await post.save();

        const populatedPost = await Post.findById(post._id)
            .populate({
                path: 'comments.user',
                select: '-password'
            });

        const newComment = populatedPost.comments[populatedPost.comments.length - 1];

        res.status(201).json({
            comment: newComment,
            commentCount: post.comments.length
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate({
                path: 'comments.user',
                select: '-password'
            });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post.comments);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.post('/:id/repost', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const originalPost = await Post.findById(req.params.id).populate('user', '-password');

        if (!originalPost) {
            return res.status(404).json({ message: 'Original post not found' });
        }

        const content = req.body.content || `Reposted: ${originalPost.content.substring(0, 50)}${originalPost.content.length > 50 ? '...' : ''}`;

        // Create the repost
        const repost = new Post({
            content: content,
            user: currentUserId,
            isRepost: true,
            originalPost: req.params.id,
            originalUser: originalPost.user._id
        });

        const savedRepost = await repost.save();

        await Post.findByIdAndUpdate(req.params.id, {
            $inc: { repostCounter: 1 }
        });

        const populatedRepost = await Post.findById(savedRepost._id)
            .populate('user', '-password')
            .populate({
                path: 'originalPost',
                populate: {
                    path: 'user',
                    select: '-password'
                }
            });

        res.status(201).json({
            _id: populatedRepost._id,
            content: populatedRepost.content,
            user: populatedRepost.user,
            createdAt: populatedRepost.createdAt,
            likes: 0,
            comments: 0,
            isLiked: false,
            isRepost: true,
            originalPost: {
                _id: populatedRepost.originalPost._id,
                content: populatedRepost.originalPost.content,
                user: populatedRepost.originalPost.user,
                createdAt: populatedRepost.originalPost.createdAt,
                repostCounter: populatedRepost.originalPost.repostCounter + 1
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
module.exports = router;