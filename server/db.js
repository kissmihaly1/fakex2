const mongoose = require('mongoose');
require('dotenv').config();

const parseMongoURI = (uri) => {
    const parts = uri.split('/');
    if (parts.length >= 4) {
        const dbNameWithParams = parts[3];
        const dbName = dbNameWithParams.split('?')[0];
        return dbName || null;
    }
    return null;
};

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        let dbName = parseMongoURI(mongoURI);


        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        

        const collections = await mongoose.connection.db.listCollections().toArray();

        
        return conn;
    } catch (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; 