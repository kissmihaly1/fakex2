const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
require('dotenv').config();

module.exports = async function(req, res, next) {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ msg: 'Server configuration error' });
        }
        

        const decoded = jwt.verify(token, jwtSecret);

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            console.error('No user ID found in token');
            return res.status(401).json({ msg: 'Invalid token format' });
        }

        const adminUser = await Admin.findById(userId);
        if (adminUser) {
            req.user = adminUser;
            req.user.id = adminUser._id;
            req.isAdmin = true;
            next();
            return;
        }

        const regularUser = await User.findById(userId);

        if (!regularUser) {
            return res.status(401).json({ msg: 'User not found' });
        }

        req.user = regularUser;
        req.user.id = regularUser._id;
        req.isAdmin = false;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};