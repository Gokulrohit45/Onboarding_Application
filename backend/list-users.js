require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const users = await User.find({});
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.userId}, Verified: ${u.isVerified})`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
