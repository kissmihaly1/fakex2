const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Admin = require('./models/Admin');
const Comment = require('./models/comment.model');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const jwt = require('jsonwebtoken');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const defaultImagePath = path.join(uploadDir, 'default-profile-image.png');
if (!fs.existsSync(defaultImagePath)) {
    try {
        const defaultImageSrc = path.join(__dirname, 'assets', 'default-profile-image.png');
        if (fs.existsSync(defaultImageSrc)) {
            fs.copyFileSync(defaultImageSrc, defaultImagePath);
        } else {
        }
    } catch (error) {
        console.error('Error creating default profile image:', error);
    }
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {

        await createDefaultAdmin();
    })
    .catch(err => console.error('MongoDB connection error:', err));

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin', salt);
            
            const admin = new Admin({
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword
            });
            
            await admin.save();
        } else {
        }
    } catch (err) {
        console.error('Error creating default admin:', err);
    }
}

app.use(cors());
app.use(bodyParser.json());
const postsRouter = require('./routes/post');
app.use('/api/posts', postsRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                msg: 'User with this email or username already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            msg: 'User registered successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            msg: 'Server error'
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await Admin.findOne({ email });
        let isAdmin = true;
        
        if (!user) {
            user = await User.findOne({ email });
            isAdmin = false;
        }

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        
        if (!isAdmin) {
            if (user.isDeleted) {
                return res.status(403).json({ msg: 'This account has been removed' });
            }
            
            if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
                return res.status(403).json({
                    message: 'Your account has been temporarily suspended until ' +
                        new Date(user.bannedUntil).toLocaleDateString()
                });
            }
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user._id,
                isAdmin: isAdmin 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin
            },
            msg: 'Login successful'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

app.get('/debug/check-image', (req, res) => {
    const imagePath = req.query.path || '/uploads/default-profile-image.png';
    const fullPath = path.join(__dirname, imagePath.startsWith('/') ? '.' + imagePath : imagePath);

    
    if (fs.existsSync(fullPath)) {
        res.json({ 
            exists: true, 
            path: imagePath,
            fullPath: fullPath,
            url: `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
        });
    } else {
        res.json({ 
            exists: false, 
            path: imagePath,
            fullPath: fullPath,
            message: 'Image file not found' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));