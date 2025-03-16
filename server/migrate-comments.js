const mongoose = require('mongoose');
const Post = require('./models/post.model');
const Comment = require('./models/comment.model');
require('dotenv').config();

async function migrateComments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const posts = await Post.find({}).exec();

    let totalCommentsProcessed = 0;
    let postsUpdated = 0;
    
    for (const post of posts) {
      if (!post.comments || !Array.isArray(post.comments) || post.comments.length === 0) {
        continue;
      }
      

      const commentPromises = post.comments.map(async (comment) => {
        const newComment = new Comment({
          content: comment.content,
          user: comment.user,
          post: post._id,
          createdAt: comment.createdAt || new Date()
        });
        
        return newComment.save();
      });
      
      const createdComments = await Promise.all(commentPromises);
      totalCommentsProcessed += createdComments.length;
      
      post.commentCount = createdComments.length;
      post.comments = undefined;
      await post.save();
      postsUpdated++;
      
    }
    

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

migrateComments();