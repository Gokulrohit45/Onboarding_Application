const express = require('express');
const router = express.Router();
const { protect, protectWithFace } = require('../middleware/authMiddleware');
const axios = require('axios');
const supabase = require('../config/supabase');

// ======================================================
// 🔹 SAVE OFFER
// ======================================================
router.post('/save', protectWithFace, async (req, res) => {
    res.json({ message: 'Offer saved', data: req.body });
});

// ======================================================
// 🔹 SEND EMAIL (BREVO)
// ======================================================
router.post('/send-email', protectWithFace, async (req, res) => {
    try {
        const { toEmail, candidateName, pdfBase64, customFileName, customSubject, customMailContent, ccEmails } = req.body;

        if (!toEmail || !candidateName || !pdfBase64) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        // Validate email format and prevent multiple emails (header/CC injection)
        const emailRegex = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
        if (!emailRegex.test(toEmail)) {
            return res.status(400).json({ message: 'Invalid email format. Only a single email address is allowed.' });
        }

        const base64Content = pdfBase64.includes('base64,')
            ? pdfBase64.split('base64,')[1]
            : pdfBase64;

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
            ccList.push({ email: 'gokulnath96880@gmail.com' });
        }

        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.BREVO_SENDER_NAME || 'VTAB Admin',
                    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER,
                },
                to: [{ email: toEmail }],
                cc: ccList,
                subject: customSubject || 'Offer Letter',
                textContent: customMailContent || `Dear ${candidateName}, Please find your offer letter.`,
                attachment: [
                    {
                        content: base64Content,
                        name: customFileName || `${candidateName}.pdf`,
                    },
                ],
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                },
            }
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
        res.status(500).json({ error: err.message });
    }
});

// ======================================================
// 🔹 BULK UPLOAD
// ======================================================
router.post('/bulk-upload', protectWithFace, async (req, res) => {
    try {
        const { candidates } = req.body;

        if (!candidates || candidates.length === 0) {
            return res.status(400).json({ message: 'No data' });
        }

        const results = [];

        for (const candidate of candidates) {
            try {
                let { data: existingOffer } = await supabase
                    .from('offers')
                    .select('*')
                    .eq('candidate_name', candidate.candidateName)
                    .maybeSingle();

                if (existingOffer) {
                    // Compare fields
                    const isDuplicate =
                        existingOffer.door_no === candidate.doorNo &&
                        existingOffer.street === candidate.street &&
                        existingOffer.address_line1 === candidate.addressLine1 &&
                        existingOffer.address_line2 === candidate.addressLine2 &&
                        existingOffer.district === candidate.district &&
                        existingOffer.state === candidate.state &&
                        existingOffer.pincode === candidate.pincode &&
                        existingOffer.designation === candidate.designation &&
                        existingOffer.joining_date === candidate.joiningDate &&
                        existingOffer.reporting_manager === candidate.reportingManager &&
                        existingOffer.location === candidate.location &&
                        existingOffer.offer_date === candidate.date;

                    if (isDuplicate) {
                        results.push({
                            candidateName: candidate.candidateName,
                            success: false,
                            error: 'Offer letter already exists',
                        });
                        continue;
                    }

                    // Fields differ -> update DB
                    const { error: updateError } = await supabase
                        .from('offers')
                        .update({
                            door_no: candidate.doorNo,
                            street: candidate.street,
                            address_line1: candidate.addressLine1,
                            address_line2: candidate.addressLine2,
                            district: candidate.district,
                            state: candidate.state,
                            pincode: candidate.pincode,
                            designation: candidate.designation,
                            joining_date: candidate.joiningDate,
                            reporting_manager: candidate.reportingManager,
                            location: candidate.location,
                            offer_date: candidate.date,
                            updated_at: new Date()
                        })
                        .eq('id', existingOffer.id);

                    if (updateError) throw updateError;

                    results.push({
                        candidateName: candidate.candidateName,
                        success: true,
                        message: 'Offer letter updated',
                    });
                } else {
                    const { error: insertError } = await supabase
                        .from('offers')
                        .insert({
                            candidate_name: candidate.candidateName,
                            door_no: candidate.doorNo,
                            street: candidate.street,
                            address_line1: candidate.addressLine1,
                            address_line2: candidate.addressLine2,
                            district: candidate.district,
                            state: candidate.state,
                            pincode: candidate.pincode,
                            designation: candidate.designation,
                            joining_date: candidate.joiningDate,
                            reporting_manager: candidate.reportingManager,
                            location: candidate.location,
                            offer_date: candidate.date,
                        });

                    if (insertError) throw insertError;

                    results.push({
                        candidateName: candidate.candidateName,
                        success: true,
                    });
                }
            } catch (err) {
                results.push({
                    candidateName: candidate.candidateName,
                    success: false,
                    error: err.message,
                });
            }
        }

        res.json({
            success: true,
            total: candidates.length,
            results,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;