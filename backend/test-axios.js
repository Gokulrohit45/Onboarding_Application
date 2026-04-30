const axios = require('axios');

const test = async () => {
    const baseURL = 'http://localhost:5000/api';
    const instance = axios.create({ baseURL });
    
    console.log('Testing with leading slash:');
    console.log('Request URL:', instance.getUri({ url: '/user-auth/admin/users' }));
    
    console.log('\nTesting without leading slash:');
    console.log('Request URL:', instance.getUri({ url: 'user-auth/admin/users' }));
};

test();
