const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String, default: '/uploads/default-profile-image.png' },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    bannedUntil: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, collection: 'users' });

userSchema.pre('find', function() {
});

userSchema.pre('findOne', function() {
});

const UserModel = mongoose.model('User', userSchema, 'users');

module.exports = UserModel;
