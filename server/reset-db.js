const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.JWT_SECRET) {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const User = require('./models/User');
const Admin = require('./models/Admin');
const Post = require('./models/post.model');
const Comment = require('./models/comment.model');

async function resetDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        console.log('\n🗑️  Clearing database...');

        const deletedUsers = await User.deleteMany({});
        console.log(`  ✓ Deleted ${deletedUsers.deletedCount} users`);

        const deletedPosts = await Post.deleteMany({});
        console.log(`  ✓ Deleted ${deletedPosts.deletedCount} posts`);

        const deletedComments = await Comment.deleteMany({});
        console.log(`  ✓ Deleted ${deletedComments.deletedCount} comments`);

        console.log('\n✅ Database reset complete!');
        console.log('💡 Restart the server to seed with fresh data');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting database:', err);
        process.exit(1);
    }
}

resetDatabase();
