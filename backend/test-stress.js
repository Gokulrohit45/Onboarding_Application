require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const testStress = async () => {
    try {
        const token = jwt.sign({ id: 'dummy', role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS512' });
        
        console.log('Sending 5 requests to check stability...');
        for (let i = 0; i < 5; i++) {
            try {
                const res = await axios.get('http://localhost:5000/api/user-auth/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`Request ${i+1}: Success (${res.data.length} users)`);
            } catch (err) {
                console.log(`Request ${i+1}: Failed - ${err.message}`);
            }
        }
        
    } catch (err) {
        console.error('Test script error:', err.message);
    }
};

testStress();
