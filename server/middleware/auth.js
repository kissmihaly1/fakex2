const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.JWT_SECRET) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

module.exports = async function(req, res, next) {
    const authHeader = req.header('Authorization');
    const token = req.header('x-auth-token') || (authHeader && authHeader.replace(/Bearer\s+/i, ''));

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

        if (!process.env.JWT_SECRET) {
            console.warn('JWT_SECRET missing in environment; falling back to insecure dev-secret.');
            process.env.JWT_SECRET = jwtSecret;
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
