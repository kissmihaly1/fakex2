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

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.JWT_SECRET) {
    console.log('JWT_SECRET not found in server/.env, trying root .env');
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET missing; using insecure dev-secret. Set JWT_SECRET in server/.env for production.');
    process.env.JWT_SECRET = 'dev-secret';
}

const app = express();
const jwt = require('jsonwebtoken');

let totalRequests = 0;
let errorRequests = 0;
let requestDurationTotal = 0;

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
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        totalRequests += 1;
        requestDurationTotal += durationSeconds;
        if (res.statusCode >= 500) {
            errorRequests += 1;
        }
    });
    next();
});

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        await createDefaultAdmin();
        await ensureUserProfileImages();
        await seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));

async function createDefaultAdmin() {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin', salt);

            const admin = new Admin({
                name: 'Admin',
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                profileImage: '/uploads/default-profile-image.png'
            });

            await admin.save();
        }
    } catch (err) {
        console.error('Error creating default admin:', err);
    }
}

async function ensureUserProfileImages() {
    try {
        const usersWithoutImage = await User.updateMany(
            { $or: [{ profileImage: { $exists: false } }, { profileImage: null }, { profileImage: '' }] },
            { $set: { profileImage: '/uploads/default-profile-image.png' } }
        );

        const adminsWithoutImage = await Admin.updateMany(
            { $or: [{ profileImage: { $exists: false } }, { profileImage: null }, { profileImage: '' }] },
            { $set: { profileImage: '/uploads/default-profile-image.png' } }
        );

        if (usersWithoutImage.modifiedCount > 0 || adminsWithoutImage.modifiedCount > 0) {
            console.log(`Updated ${usersWithoutImage.modifiedCount} users and ${adminsWithoutImage.modifiedCount} admins with default profile images`);
        }
    } catch (err) {
        console.error('Error ensuring user profile images:', err);
    }
}

async function seedDatabase() {
    try {
        const Post = require('./models/post.model');

        const userCount = await User.countDocuments();
        if (userCount >= 5) {
            console.log('✓ Database already seeded with users');
            return;
        }

        console.log('🌱 Seeding database with sample data...');

        const sampleUsers = [
            { username: 'alice_dev', email: 'alice@example.com', name: 'Alice Johnson', bio: 'Full-stack developer 💻', avatar: 'https://i.pravatar.cc/150?img=1' },
            { username: 'bob_designer', email: 'bob@example.com', name: 'Bob Smith', bio: 'UI/UX Designer | Coffee lover ☕', avatar: 'https://i.pravatar.cc/150?img=12' },
            { username: 'carol_writer', email: 'carol@example.com', name: 'Carol Williams', bio: 'Technical writer and blogger 📝', avatar: 'https://i.pravatar.cc/150?img=5' },
            { username: 'david_engineer', email: 'david@example.com', name: 'David Brown', bio: 'Software Engineer at TechCorp 🚀', avatar: 'https://i.pravatar.cc/150?img=13' },
            { username: 'emma_product', email: 'emma@example.com', name: 'Emma Davis', bio: 'Product Manager | Tech enthusiast', avatar: 'https://i.pravatar.cc/150?img=9' },
            { username: 'frank_data', email: 'frank@example.com', name: 'Frank Miller', bio: 'Data Scientist 📊', avatar: 'https://i.pravatar.cc/150?img=15' },
        ];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const createdUsers = [];
        for (const userData of sampleUsers) {
            const existingUser = await User.findOne({
                $or: [{ email: userData.email }, { username: userData.username }]
            });

            if (existingUser) {
                console.log(`  ⚠️  User ${userData.username} already exists, skipping...`);
                createdUsers.push(existingUser);
                continue;
            }

            const user = new User({
                name: userData.name,
                username: userData.username,
                email: userData.email,
                bio: userData.bio,
                password: hashedPassword,
                profileImage: userData.avatar
            });

            const savedUser = await user.save();
            createdUsers.push(savedUser);
            console.log(`  ✓ Created user: ${userData.username}`);
        }

        if (createdUsers.length === 0) {
            console.log('⚠️  No users were created (all already exist)');
            return;
        }

        console.log(`✓ Created ${createdUsers.length} sample users`);

        let followCount = 0;
        for (let i = 0; i < createdUsers.length; i++) {
            const followerCount = Math.floor(Math.random() * 3) + 1; // 1-3 followers
            const possibleFollows = createdUsers.filter((_, idx) => idx !== i);

            for (let j = 0; j < followerCount && j < possibleFollows.length; j++) {
                const userToFollow = possibleFollows[j];
                await User.findByIdAndUpdate(createdUsers[i]._id, {
                    $addToSet: { following: userToFollow._id }
                });
                await User.findByIdAndUpdate(userToFollow._id, {
                    $addToSet: { followers: createdUsers[i]._id }
                });
                followCount++;
            }
        }

        console.log(`✓ Created ${followCount} follow relationships`);

        const samplePosts = [
            { content: 'Just deployed my first full-stack application! 🎉', userId: 0 },
            { content: 'Working on a new UI design for our product. Feedback welcome!', userId: 1 },
            { content: 'Published a new blog post about modern web development trends.', userId: 2 },
            { content: 'Debugging can be frustrating, but solving the problem is so satisfying!', userId: 3 },
            { content: 'Excited to announce our new product feature launching next week!', userId: 4 },
            { content: 'Data visualization is an art form. Check out my latest dashboard!', userId: 5 },
            { content: 'Coffee and code - the perfect combination ☕💻', userId: 0 },
            { content: 'Typography matters more than you think in web design.', userId: 1 },
            { content: 'Tips for writing better technical documentation:', userId: 2 },
            { content: 'Clean code is not just about functionality, it\'s about readability too.', userId: 3 },
            { content: 'User feedback is the most valuable resource for product development.', userId: 4 },
            { content: 'Machine learning models are only as good as the data you feed them.', userId: 5 },
        ];

        const createdPosts = [];
        for (const postData of samplePosts) {
            const post = new Post({
                content: postData.content,
                user: createdUsers[postData.userId]._id,
                likes: [],
                commentCount: 0,
                repostCounter: 0
            });
            const savedPost = await post.save();
            createdPosts.push(savedPost);
        }

        console.log(`✓ Created ${createdPosts.length} sample posts`);

        const repostsToCreate = [
            { originalPostIdx: 0, repostUserId: 3, comment: 'This is awesome! Congrats!' },
            { originalPostIdx: 3, repostUserId: 0, comment: 'So true!' },
            { originalPostIdx: 5, repostUserId: 4, comment: 'Great work on this!' },
        ];

        for (const repostData of repostsToCreate) {
            const originalPost = createdPosts[repostData.originalPostIdx];
            const repost = new Post({
                content: repostData.comment,
                user: createdUsers[repostData.repostUserId]._id,
                isRepost: true,
                originalPost: originalPost._id,
                originalUser: originalPost.user,
                likes: [],
                commentCount: 0,
                repostCounter: 0
            });
            await repost.save();

            await Post.findByIdAndUpdate(originalPost._id, {
                $inc: { repostCounter: 1 }
            });
        }

        console.log(`✓ Created ${repostsToCreate.length} sample reposts`);

        for (let i = 0; i < createdPosts.length; i++) {
            const likeCount = Math.floor(Math.random() * 4); // 0-3 likes
            const likersSet = new Set();

            while (likersSet.size < likeCount && likersSet.size < createdUsers.length) {
                const randomUserIdx = Math.floor(Math.random() * createdUsers.length);
                likersSet.add(createdUsers[randomUserIdx]._id);
            }

            if (likersSet.size > 0) {
                await Post.findByIdAndUpdate(createdPosts[i]._id, {
                    likes: Array.from(likersSet)
                });
            }
        }

        console.log('✓ Added random likes to posts');
        console.log('');
        console.log('✅ Database seeding completed successfully!');
        console.log('📝 Login credentials:');
        console.log('   Admin: admin@example.com / admin');
        console.log('   Users: alice@example.com / password123 (or any seeded user email)');
        console.log('');

    } catch (err) {
        console.error('❌ Error seeding database:', err);
        console.error('Stack trace:', err.stack);
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

app.get('/metrics', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send([
        'fakex_up 1',
        `fakex_requests_total ${totalRequests}`,
        `fakex_request_errors_total ${errorRequests}`,
        `fakex_request_duration_seconds_total ${requestDurationTotal}`
    ].join('\n'));
});

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
                name: user.name || '',
                username: user.username,
                email: user.email,
                profileImage: user.profileImage || '/uploads/default-profile-image.png',
                bio: user.bio || '',
                followers: user.followers || [],
                following: user.following || [],
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
