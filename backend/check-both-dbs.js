const mongoose = require('mongoose');
const User = require('./models/User');

const checkUsers = async (uri) => {
    try {
        console.log(`Connecting to ${uri.split('@')[1].split('/')[0]}...`);
        await mongoose.connect(uri);
        const count = await User.countDocuments();
        console.log(`Total users in this DB: ${count}`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
};

(async () => {
    const uri1 = "mongodb+srv://paper-Scout:Sanjay1306@cluster0.phtk1.mongodb.net/offer_editer?retryWrites=true&w=majority&appName=Cluster0";
    const uri2 = "mongodb+srv://techdotsanjay_db_user:5ic2mHpFvLJZ9lkj@cluster0.1u6liox.mongodb.net/offer_editer?retryWrites=true&w=majority";
    
    console.log("Checking DB 1 (.env):");
    await checkUsers(uri1);
    
    console.log("\nChecking DB 2 (test-db.js):");
    await checkUsers(uri2);
})();
