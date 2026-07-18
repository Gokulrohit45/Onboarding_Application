const express = require('express');
const router = express.Router();
const axios = require('axios');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/authMiddleware');

// Admin email is hardcoded to the static address requested
const ADMIN_EMAIL = 'gokulnath96880@gmail.com';

// ======================================================
// 🔹 GENERATE OTP
// ======================================================
router.post('/generate', protect, async (req, res) => {
    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTPs
        await supabase.from('otps').delete().gte('created_at', '1970-01-01');

        // Save the new OTP
        await supabase.from('otps').insert({ otp });

        // Send OTP to admin email via Brevo
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.BREVO_SENDER_NAME || 'VTAB Admin Portal',
                    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
                },
                to: [{ email: ADMIN_EMAIL }],
                subject: '🔐 OTP Verification - VTAB Admin Portal',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 12px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h2 style="color: #1e293b; margin: 0 0 8px;">VTAB Square Admin Portal</h2>
                            <p style="color: #64748b; margin: 0; font-size: 14px;">Action Verification Required</p>
                        </div>
                        <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Your One-Time Password (OTP) is:</p>
                            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 240px;">
                                <span style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px;">${otp}</span>
                            </div>
                            <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0;">This OTP expires in <strong>15 minutes</strong>.</p>
                        </div>
                        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                            If you did not initiate this action, please ignore this email.
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

        // Return the email so the frontend can display it dynamically
        res.json({ success: true, message: `OTP sent to ${ADMIN_EMAIL}`, email: ADMIN_EMAIL });
    } catch (err) {
        console.error('OTP generation error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ======================================================
// 🔹 VERIFY OTP
// ======================================================
router.post('/verify', protect, async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, message: 'OTP is required.' });
        }

        const { data: found } = await supabase
            .from('otps')
            .select('*')
            .eq('otp', otp)
            .maybeSingle();

        if (!found) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // Validate 15 minute expiry (15 * 60 * 1000 = 900,000 ms)
        const ageInMs = Date.now() - new Date(found.created_at).getTime();
        if (ageInMs > 15 * 60 * 1000) {
            await supabase.from('otps').delete().eq('id', found.id);
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // OTP is valid - delete it so it can't be reused
        await supabase.from('otps').delete().eq('id', found.id);

        res.json({ success: true, message: 'OTP verified successfully.' });
    } catch (err) {
        console.error('OTP verification error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ======================================================
// 🔹 GET DEFAULT CC EMAILS
// ======================================================
router.get('/default-cc', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('default_cc_emails')
            .select('email');

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.json({ success: true, emails: ['gokulnath96880@gmail.com'] });
        }

        res.json({ success: true, emails: data.map(r => r.email) });
    } catch (err) {
        console.error('Fetch default CC error:', err.message);
        // Return fallback list so the app works even if the table isn't created yet
        res.json({ success: true, emails: ['gokulnath96880@gmail.com'] });
    }
});

// ======================================================
// 🔹 UPDATE DEFAULT CC EMAILS
// ======================================================
router.post('/default-cc', protect, async (req, res) => {
    try {
        const { ccEmails } = req.body;

        if (Array.isArray(ccEmails)) {
            // Delete all existing
            await supabase.from('default_cc_emails').delete().neq('email', '');

            // Insert new ones if any
            if (ccEmails.length > 0) {
                const rows = ccEmails
                    .map(email => email.trim())
                    .filter(Boolean)
                    .map(email => ({ email }));

                if (rows.length > 0) {
                    const { error } = await supabase.from('default_cc_emails').insert(rows);
                    if (error) throw error;
                }
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update default CC error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
