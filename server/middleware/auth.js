const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, 'caaa1f2fad369eaf576de00a7cf897de38f944bcc6b2ef346e4567ec6d0e88ca');


        const user = await User.findById(decoded.userId || decoded.id);

        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ msg: 'Token is not valid', token: token });
    }
};