const axios = require('axios');

const sendUserCredentialsEmail = async (email, tempPassword, loginUrl, verificationUrl) => {
    try {
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.BREVO_SENDER_NAME || 'VTAB Onboarding',
                    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
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

const sendResetPasswordOtpEmail = async (email, otp) => {
    try {
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.BREVO_SENDER_NAME || 'VTAB Onboarding',
                    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
                },
                to: [{ email }],
                subject: '🔐 Password Reset OTP - VTAB Onboarding',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 12px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h2 style="color: #1e293b; margin: 0 0 8px;">VTAB Onboarding</h2>
                            <p style="color: #64748b; margin: 0; font-size: 14px;">Password Reset Verification Code</p>
                        </div>
                        <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Your password reset verification code (OTP) is:</p>
                            <div style="background: linear-gradient(135deg, #ef4444, #f43f5e); border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 240px;">
                                <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px;">${otp}</span>
                            </div>
                            <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0;">This OTP is valid for <strong>15 minutes</strong>.</p>
                        </div>
                        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                            If you did not request a password reset, please ignore this email.
                        </p>
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
        console.error('Reset password email error:', err.response?.data || err.message);
        return false;
    }
};

module.exports = { sendUserCredentialsEmail, sendResetPasswordOtpEmail };
