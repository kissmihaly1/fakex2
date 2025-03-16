const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Comment = require('../models/comment.model');
const upload = require('../middleware/uploadMiddleware');


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
                comments: post.commentCount || 0,
                isLiked: isLiked,
                repostCounter: post.repostCounter || 0,
                image: post.image
            };

            if (post.isRepost && post.originalPost) {
                formattedPost.isRepost = true;
                formattedPost.originalPost = {
                    _id: post.originalPost._id,
                    content: post.originalPost.content,
                    user: post.originalPost.user,
                    createdAt: post.originalPost.createdAt,
                    image: post.originalPost.image,
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
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const posts = await Post.find({ user: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('user', 'name username profileImage')
            .populate({
                path: 'originalPost',
                populate: {
                    path: 'user',
                    select: 'name username profileImage'
                }
            });

        const formattedPosts = posts.map(post => {
            const isLiked = post.likes && post.likes.some(
                like => like.toString() === currentUserId.toString()
            );

            const formattedPost = {
                _id: post._id,
                content: post.content,
                user: post.user,
                createdAt: post.createdAt,
                likes: post.likes ? post.likes.length : 0,
                comments: post.commentCount || 0,
                isLiked: isLiked,
                repostCounter: post.repostCounter || 0,
                image: post.image
            };

            if (post.isRepost && post.originalPost) {
                formattedPost.isRepost = true;
                formattedPost.originalPost = {
                    _id: post.originalPost._id,
                    content: post.originalPost.content,
                    user: post.originalPost.user,
                    createdAt: post.originalPost.createdAt,
                    image: post.originalPost.image,
                    repostCounter: post.originalPost.repostCounter || 0
                };
            }

            return formattedPost;
        });

        res.status(200).json(formattedPosts);
    } catch (error) {
        console.error('Error getting user posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const currentUserId = req.user._id;
        
        const postData = {
            content: req.body.content,
            user: currentUserId
        };
        
        if (req.file) {
            postData.image = `/uploads/${req.file.filename}`;
        }

        const post = new Post(postData);

        const savedPost = await post.save();
        const populatedPost = await Post.findById(savedPost._id).populate('user', '-password');

        res.status(201).json({
            _id: populatedPost._id,
            content: populatedPost.content,
            user: populatedPost.user,
            createdAt: populatedPost.createdAt,
            likes: 0,
            comments: 0,
            isLiked: false,
            image: populatedPost.image
        });
    } catch (err) {
        console.error('Error creating post:', err);
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

router.delete('/:id', auth, async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }


        const isPostOwner = post.user.toString() === currentUserId.toString();
        const isAdmin = req.isAdmin === true;
        

        if (!isPostOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully', postId: req.params.id });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(400).json({ message: err.message });
    }
});

router.post('/:id/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const newComment = new Comment({
            content: req.body.content,
            user: req.user.id,
            post: req.params.id
        });

        const comment = await newComment.save();

        post.commentCount = (post.commentCount || 0) + 1;
        await post.save();

        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'username profileImage');

        res.json({
            comment: populatedComment,
            commentCount: post.commentCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/:id/comments', auth, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const comments = await Comment.find({ post: req.params.id })
            .populate('user', 'username name profileImage')
            .sort({ createdAt: -1 });

        const formattedComments = comments.map(comment => {
            const commentObj = comment.toObject();
            commentObj.isLiked = comment.likes && comment.likes.some(
                like => like.toString() === currentUserId.toString()
            );
            commentObj.likes = comment.likes ? comment.likes.length : 0;
            return commentObj;
        });

        res.json(formattedComments);
    } catch (err) {
        console.error('Error getting comments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.delete('/comments/:id', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user.id && !req.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const post = await Post.findById(comment.post);
        
        if (post) {
            post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
            await post.save();
        }

        await comment.remove();

        res.json({ 
            msg: 'Comment removed',
            commentCount: post ? post.commentCount : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
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

        const repost = new Post({
            content: content,
            user: currentUserId,
            isRepost: true,
            originalPost: req.params.id,
            originalUser: originalPost.user._id,
            commentCount: 0
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
                image: populatedRepost.originalPost.image,
                repostCounter: populatedRepost.originalPost.repostCounter + 1
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.post('/:postId/comments/:commentId/like', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        
        if (!comment.likes) {
            comment.likes = [];
        }
        
        if (comment.likes.includes(req.user.id)) {
            return res.status(400).json({ message: 'Comment already liked' });
        }
        
        comment.likes.push(req.user.id);
        await comment.save();
        
        res.json({
            _id: comment._id,
            likes: comment.likes.length,
            isLiked: true
        });
    } catch (err) {
        console.error('Error liking comment:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:postId/comments/:commentId/unlike', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        
        if (!comment.likes) {
            comment.likes = [];
        }
        
        comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
        await comment.save();
        
        res.json({
            _id: comment._id,
            likes: comment.likes.length,
            isLiked: false
        });
    } catch (err) {
        console.error('Error unliking comment:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;