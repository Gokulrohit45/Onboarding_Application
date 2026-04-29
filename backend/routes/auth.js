const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

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

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin)
      return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await admin.matchPassword(password);

    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Initial token has faceVerified: false
    const token = generateToken(admin._id, admin.email, admin.employeeId, false);

    console.log(`✅ Login successful: ${admin.email} (Employee ID: ${admin.employeeId || 'N/A'})`);
    console.log(`🔑 JWT Token: ${token}`);

    res.json({
      success: true,
      token,
      email: admin.email,
      employeeId: admin.employeeId,
      faceVerified: false
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
    const targetEmpId = 'EMP017';

    // Seed second admin
    const admin2Email = 'admin@vtabsquare.com';
    const admin2Password = '12345';
    const existing2 = await Admin.findOne({ email: admin2Email });
    if (!existing2) {
      await Admin.create({
        email: admin2Email,
        password: admin2Password,
        employeeId: 'ADM001',
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