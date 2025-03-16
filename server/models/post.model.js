const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    content: {
        type: String,
        required: function() {
            return !this.isRepost;
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    commentCount: {
        type: Number,
        default: 0
    },
    isRepost: {
        type: Boolean,
        default: false
    },
    repostCounter: {
        type: Number,
        default: 0
    },
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    originalUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    image: {
        type: String,
        required: false
    }
}, { 
    timestamps: true,
    collection: 'posts'
});

PostSchema.pre('find', function() {
});

const PostModel = mongoose.model('Post', PostSchema, 'posts');

module.exports = PostModel;
