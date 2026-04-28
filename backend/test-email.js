require('dotenv').config();
const axios = require('axios');

async function testEmail() {
    try {
        console.log('Testing email with Brevo...');
        console.log('Sender:', process.env.EMAIL_USER);
        
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: 'VTAB Test',
                    email: process.env.EMAIL_USER,
                },
                to: [{ email: 'sanjaysaravanan130604@gmail.com' }],
                subject: 'Test Email',
                htmlContent: '<p>Test</p>',
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json',
                    'accept': 'application/json'
                },
            }
        );
        console.log('✅ Success:', response.data);
    } catch (err) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}

testEmail();
