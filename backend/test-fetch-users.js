require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const testFetch = async () => {
    try {
        // Create a dummy admin token (the backend protect middleware only verifies the secret)
        const token = jwt.sign({ id: 'dummy', role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS512' });
        
        console.log('Using token:', token);
        
        const res = await axios.get('http://localhost:5000/api/user-auth/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Response Status:', res.status);
        console.log('Users Count:', res.data.length);
        console.log('Users:', JSON.stringify(res.data, null, 2));
        
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
};

testFetch();
