const axios = require('axios');

const sendUserCredentialsEmail = async (email, tempPassword, loginUrl, verificationUrl) => {
    try {
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: 'VTAB Onboarding',
                    email: process.env.EMAIL_USER,
                },
                to: [{ email }],
                subject: 'Account Created - Complete Verification',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #1e293b;">Welcome to VTAB Onboarding!</h2>
                        <p>Your account has been created by the admin. Please follow the steps below to complete your verification.</p>
                        
                        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Login Email:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${tempPassword}</code></p>
                        </div>

                        <p><strong>Step 1: Face Verification</strong></p>
                        <p>Before you can login, you must verify your face using the link below:</p>
                        <a href="${verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-bottom: 20px;">Verify Face</a>

                        <p><strong>Step 2: Login</strong></p>
                        <p>After verification, you can login here:</p>
                        <a href="${loginUrl}" style="color: #6366f1;">${loginUrl}</a>

                        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Note: You will be required to change your password after your first login.</p>
                    </div>
                `,
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                },
            }
        );
        return true;
    } catch (err) {
        console.error('Email service error:', err.response?.data || err.message);
        return false;
    }
};

module.exports = { sendUserCredentialsEmail };
