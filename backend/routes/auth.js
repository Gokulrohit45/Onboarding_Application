const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

// 🔥 Generate JWT
const generateToken = (id, email, employeeId, faceVerified = false) => {
  return jwt.sign(
    { id, email, employee_id: employeeId, faceVerified },
    process.env.JWT_SECRET,
    { algorithm: 'HS512', expiresIn: '8h' }
  );
};

// ===============================
// 🔐 LOGIN
// ===============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!admin)
      return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Initial token has faceVerified: true (face auth disabled)
    const token = generateToken(admin.id, admin.email, admin.employee_id, true);

    console.log(`✅ Login successful: ${admin.email} (Employee ID: ${admin.employee_id || 'N/A'})`);
    console.log(`🔑 JWT Token: ${token}`);

    res.json({
      success: true,
      token,
      email: admin.email,
      employeeId: admin.employee_id,
      faceVerified: true
    });

  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ===============================
// 🛡️ VERIFY FACE CALLBACK
// ===============================
router.post('/verify-face', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token required' });
    }

    // Verify the incoming token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Issue a NEW token with faceVerified: true
    const newToken = generateToken(decoded.id, decoded.email, decoded.employee_id, true);

    console.log(`✅ Face Verified for: ${decoded.email}`);
    console.log(`🔑 Verified JWT Token: ${newToken}`);

    res.json({
      success: true,
      token: newToken,
      faceVerified: true
    });

  } catch (err) {
    res.status(401).json({
      message: 'Invalid or expired face verification token',
      error: err.message,
    });
  }
});

// ===============================
// 🔥 SEED ADMIN (RUN ONCE)
// ===============================
router.post('/seed', async (req, res) => {
  try {
    const targetEmail = 'techdotsanjay@gmail.com';
    const targetPassword = '12345';

    // Seed second admin
    const admin2Email = 'admin@vtabsquare.com';
    const admin2Password = '12345';

    // Seed first admin
    const { data: existing1 } = await supabase
      .from('admins')
      .select('*')
      .eq('email', targetEmail)
      .maybeSingle();

    if (!existing1) {
      const hashed1 = await bcrypt.hash(targetPassword, 10);
      await supabase.from('admins').insert({
        email: targetEmail,
        password: hashed1,
        employee_id: 'EMP017'
      });
    }

    const { data: existing2 } = await supabase
      .from('admins')
      .select('*')
      .eq('email', admin2Email)
      .maybeSingle();

    if (!existing2) {
      const hashed2 = await bcrypt.hash(admin2Password, 10);
      await supabase.from('admins').insert({
        email: admin2Email,
        password: hashed2,
        employee_id: 'ADM001',
      });
    }

    res.json({
      message: 'Admins seeded successfully',
      credentials: [
        { email: targetEmail, password: targetPassword },
        { email: admin2Email, password: admin2Password }
      ]
    });

  } catch (err) {
    res.status(500).json({
      message: 'Seed failed',
      error: err.message,
    });
  }
});

module.exports = router;