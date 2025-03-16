const User = require('../models/User');
const Admin = require('../models/Admin');

module.exports = async function(req, res, next) {
    console.log('AdminAuth middleware executed');
    try {
        if (req.user && req.user.collection && req.user.collection.name === 'admins') {
            next();
            return;
        }
        
        const adminUser = await Admin.findOne({ _id: req.user._id });
        
        if (adminUser) {
            req.user = adminUser;
            next();
            return;
        }

        return res.status(403).json({ msg: 'Admin access required' });
    } catch (err) {
        console.error('Admin auth middleware error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
}; 