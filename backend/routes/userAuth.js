const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/authMiddleware');
const { sendUserCredentialsEmail } = require('../services/emailService');

// Utility to generate JWT for users
const generateUserToken = (user, type = 'auth') => {
    const payload = { id: user.id, email: user.email, type };
    if (type === 'auth') {
        payload.faceVerified = true;
    }
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { algorithm: 'HS512', expiresIn: type === 'face_verification' ? '30d' : '7d' }
    );
};

// ======================================================
// 🔹 ADMIN: CREATE NEW USER
// ======================================================
router.post('/admin/create-user', protect, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email ID is required.' });
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Generate temporary password and unique User ID
        const tempPassword = Math.random().toString(36).slice(-10);
        const userId = 'USR' + Date.now().toString().slice(-6);
        const unionNumber = Math.floor(100000 + Math.random() * 900000).toString();

        const id = crypto.randomUUID();

        // Generate verification token
        const verificationToken = generateUserToken({ id, email: email.toLowerCase() }, 'face_verification');
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id,
                email: email.toLowerCase(),
                temp_password: hashedTempPassword,
                user_id: userId,
                union_number: unionNumber,
                is_verified: false,
                face_verification_token: verificationToken
            });

        if (insertError) throw insertError;

        // URLs for the email
        const originUrl = req.headers.origin;
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
        const fallbackUrl = isProduction 
            ? 'https://onboardingapp-renderdeployment.onrender.com' 
            : 'http://localhost:5173';
        
        const frontendUrl = originUrl || process.env.FRONTEND_URL || fallbackUrl;
        const loginUrl = `${frontendUrl}/user/login`;
        const verificationUrl = `${frontendUrl}/user/verify-face?token=${verificationToken}`;

        // Send email
        const emailSent = await sendUserCredentialsEmail(email.toLowerCase(), tempPassword, loginUrl, verificationUrl);

        res.status(201).json({
            success: true,
            message: emailSent ? 'User created and email sent.' : 'User created but email failed to send.',
            user: {
                email: email.toLowerCase(),
                userId: userId,
                unionNumber: unionNumber
            }
        });

    } catch (err) {
        console.error('CREATE USER ERROR:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ======================================================
// 🔹 USER: CAPTURE/STORE FACE DATA
// ======================================================
router.post('/user/verify-face', async (req, res) => {
    try {
        const { token, faceData } = req.body;

        if (!token || !faceData) {
            return res.status(400).json({ message: 'Token and face data required.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'face_verification') {
            return res.status(401).json({ message: 'Invalid token type.' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log(`[VERIFY-FACE] Attempting verification for User ID: ${decoded.id}`);

        const { error: updateError } = await supabase
            .from('users')
            .update({
                face_data: faceData,
                is_verified: true,
                face_verification_token: null
            })
            .eq('id', decoded.id);

        if (updateError) throw updateError;
        
        console.log(`[VERIFY-FACE] ✅ Success! User ${user.email} is now verified.`);

        res.json({ success: true, message: 'Face data verified and stored. You can now login.' });

    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token.', error: err.message });
    }
});

// ======================================================
// 🔹 USER: LOGIN
// ======================================================
router.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Check if using temp password
        const isTempMatch = await bcrypt.compare(password, user.temp_password);
        if (isTempMatch) {
            if (user.is_temp_password_expired) {
                return res.status(401).json({ message: 'Temporary password expired. Please contact admin.' });
            }
            const token = generateUserToken(user, 'reset_required');
            return res.json({
                success: true,
                resetRequired: true,
                token,
                message: 'Temporary login successful. Reset password now.'
            });
        }

        // Check regular password
        const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Regular login successful -> Bypass face match step
        const token = generateUserToken(user, 'auth');
        res.json({
            success: true,
            token,
            message: 'Login successful. Access granted.'
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ======================================================
// 🔹 USER: RESET PASSWORD
// ======================================================
router.post('/user/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'reset_required') {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', decoded.id)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                is_temp_password_expired: true
            })
            .eq('id', decoded.id);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Password updated successfully. Please login again.' });

    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
});

// ======================================================
// 🔹 USER: FACE MATCH (FINAL AUTH STEP)
// ======================================================
router.post('/user/match-face', async (req, res) => {
    try {
        const { token, liveFaceData } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'face_match_required') {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .maybeSingle();

        if (!user || !user.face_data) {
            return res.status(404).json({ message: 'User or face data not found.' });
        }

        const euclideanDistance = (v1, v2) => {
            return Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
        };

        const distance = euclideanDistance(user.face_data, liveFaceData);
        const threshold = 0.6;

        if (distance < threshold) {
            // Success! Issue final auth token
            const authToken = generateUserToken(user, 'auth');
            res.json({
                success: true,
                token: authToken,
                message: 'Face match successful. Access granted.'
            });
        } else {
            res.status(401).json({ success: false, message: 'Face not recognized.' });
        }

    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
});

// ======================================================
// 🔹 ADMIN: GET ALL USERS (BONUS)
// ======================================================
router.get('/admin/users', protect, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, user_id, union_number, is_verified, is_temp_password_expired, face_verification_token, created_at, updated_at');
        
        if (error) throw error;
        
        console.log(`[ADMIN] Found ${users.length} users.`);
        
        const mappedUsers = users.map(u => ({
            _id: u.id,
            id: u.id,
            email: u.email,
            userId: u.user_id,
            unionNumber: u.union_number,
            isVerified: u.is_verified,
            isTempPasswordExpired: u.is_temp_password_expired,
            faceVerificationToken: u.face_verification_token,
            createdAt: u.created_at,
            updatedAt: u.updated_at
        }));
        
        res.json(mappedUsers);
    } catch (err) {
        console.error('[ADMIN] Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
