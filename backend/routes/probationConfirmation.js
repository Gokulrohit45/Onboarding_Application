const express = require('express');
const router = express.Router();
const { protect, protectWithFace } = require('../middleware/authMiddleware');
const axios = require('axios');
const supabase = require('../config/supabase');

// ======================================================
// 🔹 BULK UPLOAD
// ======================================================
router.post('/bulk-upload', protectWithFace, async (req, res) => {
    try {
        const { candidates } = req.body;
        if (!candidates || candidates.length === 0)
            return res.status(400).json({ message: 'No data' });

        const results = [];

        for (const candidate of candidates) {
            try {
                let { data: existingRecord } = await supabase
                    .from('probation_confirmations')
                    .select('*')
                    .eq('employee_name', candidate.employeeName)
                    .maybeSingle();

                if (existingRecord) {
                    const isDuplicate =
                        existingRecord.effective_date === candidate.effectiveDate &&
                        existingRecord.designation === candidate.designation &&
                        existingRecord.reporting_manager === candidate.reportingManager &&
                        existingRecord.annual_hike === candidate.annualHike &&
                        existingRecord.annual_package === candidate.annualPackage &&
                        existingRecord.planned_leaves === candidate.plannedLeaves;

                    if (isDuplicate) {
                        results.push({ candidateName: candidate.employeeName, success: false, error: 'Already exists (no changes)' });
                        continue;
                    }

                    const { error: updateError } = await supabase
                        .from('probation_confirmations')
                        .update({
                            effective_date: candidate.effectiveDate,
                            door_no: candidate.doorNo,
                            street: candidate.street,
                            address_line1: candidate.addressLine1,
                            address_line2: candidate.addressLine2,
                            district: candidate.district,
                            state: candidate.state,
                            pincode: candidate.pincode,
                            designation: candidate.designation,
                            reporting_manager: candidate.reportingManager,
                            annual_hike: candidate.annualHike,
                            planned_leaves: candidate.plannedLeaves,
                            annual_package: candidate.annualPackage,
                            updated_at: new Date()
                        })
                        .eq('id', existingRecord.id);

                    if (updateError) throw updateError;

                    results.push({ candidateName: candidate.employeeName, success: true, message: 'Updated' });
                } else {
                    const { error: insertError } = await supabase
                        .from('probation_confirmations')
                        .insert({
                            employee_name: candidate.employeeName,
                            effective_date: candidate.effectiveDate,
                            door_no: candidate.doorNo,
                            street: candidate.street,
                            address_line1: candidate.addressLine1,
                            address_line2: candidate.addressLine2,
                            district: candidate.district,
                            state: candidate.state,
                            pincode: candidate.pincode,
                            designation: candidate.designation,
                            reporting_manager: candidate.reportingManager,
                            annual_hike: candidate.annualHike,
                            planned_leaves: candidate.plannedLeaves,
                            annual_package: candidate.annualPackage,
                        });

                    if (insertError) throw insertError;

                    results.push({ candidateName: candidate.employeeName, success: true });
                }
            } catch (err) {
                results.push({ candidateName: candidate.employeeName || 'Unknown', success: false, error: err.message });
            }
        }

        res.json({ success: true, total: candidates.length, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======================================================
// 🔹 SEND EMAIL (BREVO)
// ======================================================
router.post('/send-email', protectWithFace, async (req, res) => {
    try {
        const { toEmail, candidateName, pdfBase64, customFileName, customSubject, customMailContent, ccEmails } = req.body;
        if (!toEmail || !candidateName || !pdfBase64)
            return res.status(400).json({ message: 'Missing fields' });

        // Validate email format and prevent multiple emails (header/CC injection)
        const emailRegex = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
        if (!emailRegex.test(toEmail)) {
            return res.status(400).json({ message: 'Invalid email format. Only a single email address is allowed.' });
        }

        const base64Content = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;

        // Build CC list
        const ccList = [];
        if (Array.isArray(ccEmails)) {
            ccEmails.forEach(email => {
                if (email && email.trim() && emailRegex.test(email.trim())) {
                    ccList.push({ email: email.trim() });
                }
            });
        }
        if (ccList.length === 0) {
            ccList.push({ email: 'meenakumarik.vtab@gmail.com' });
        }

        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.BREVO_SENDER_NAME || 'VTAB Admin',
                    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER
                },
                to: [{ email: toEmail }],
                cc: ccList,
                subject: customSubject || `Probation Confirmation Letter – ${candidateName}`,
                textContent: customMailContent || `Dear ${candidateName}, Please find your Probation Confirmation Letter attached.`,
                attachment: [{ content: base64Content, name: customFileName || `${candidateName}_ProbationConfirmation.pdf` }],
            },
            { headers: { 'api-key': process.env.BREVO_API_KEY } }
        );

        // Persist CC emails dynamically
        if (Array.isArray(ccEmails)) {
            try {
                await supabase.from('default_cc_emails').delete().neq('email', '');
                if (ccEmails.length > 0) {
                    const rows = ccEmails
                        .map(email => email.trim())
                        .filter(Boolean)
                        .map(email => ({ email }));
                    if (rows.length > 0) {
                        await supabase.from('default_cc_emails').insert(rows);
                    }
                }
            } catch (dbErr) {
                console.error('Failed to sync default CC emails to DB:', dbErr.message);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message, message: err.response?.data?.message || err.message });
    }
});

module.exports = router;
