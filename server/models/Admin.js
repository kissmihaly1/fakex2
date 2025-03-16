const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String, default: 'http://localhost:3000/uploads/default-profile-image.png' },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
}, { timestamps: true, collection: 'admins' });

adminSchema.pre('find', function() {
});

adminSchema.pre('findOne', function() {
});

const AdminModel = mongoose.model('Admin', adminSchema, 'admins');

module.exports = AdminModel; 