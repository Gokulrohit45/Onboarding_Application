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
        if (!candidates || candidates.length === 0) return res.status(400).json({ message: 'No data' });

        const results = [];
        for (const candidate of candidates) {
            try {
                let { data: existingAgreement } = await supabase
                    .from('policy_agreements')
                    .select('*')
                    .eq('candidate_name', candidate.candidateName)
                    .maybeSingle();

                if (existingAgreement) {
                    const isDuplicate =
                        String(existingAgreement.stipend || '') === String(candidate.stipend || '') &&
                        String(existingAgreement.probation_salary || '') === String(candidate.probationSalary || '') &&
                        String(existingAgreement.post_probation_salary || '') === String(candidate.postProbationSalary || '') &&
                        String(existingAgreement.work_start_time || '') === String(candidate.workStartTime || '') &&
                        String(existingAgreement.work_end_time || '') === String(candidate.workEndTime || '') &&
                        String(existingAgreement.internship_months || '') === String(candidate.internshipMonths || '') &&
                        String(existingAgreement.training_months || '') === String(candidate.trainingMonths || '') &&
                        String(existingAgreement.probation_months || '') === String(candidate.probationMonths || '') &&
                        String(existingAgreement.post_probation_months || '') === String(candidate.postProbationMonths || '') &&
                        String(existingAgreement.employee_type || 'Internship') === String(candidate.employeeType || 'Internship');

                    if (isDuplicate) {
                        results.push({ candidateName: candidate.candidateName, success: false, error: 'Agreement already exists' });
                        continue;
                    }

                    const { error: updateError } = await supabase
                        .from('policy_agreements')
                        .update({
                            stipend: candidate.stipend,
                            probation_salary: candidate.probationSalary,
                            post_probation_salary: candidate.postProbationSalary,
                            work_start_time: candidate.workStartTime,
                            work_end_time: candidate.workEndTime,
                            internship_months: candidate.internshipMonths,
                            training_months: candidate.trainingMonths,
                            probation_months: candidate.probationMonths,
                            post_probation_months: candidate.postProbationMonths,
                            employee_type: candidate.employeeType || 'Internship',
                            updated_at: new Date()
                        })
                        .eq('id', existingAgreement.id);

                    if (updateError) throw updateError;

                    results.push({ candidateName: candidate.candidateName, success: true, message: 'Agreement updated' });
                } else {
                    const { error: insertError } = await supabase
                        .from('policy_agreements')
                        .insert({
                            candidate_name: candidate.candidateName,
                            stipend: candidate.stipend,
                            probation_salary: candidate.probationSalary,
                            post_probation_salary: candidate.postProbationSalary,
                            work_start_time: candidate.workStartTime,
                            work_end_time: candidate.workEndTime,
                            internship_months: candidate.internshipMonths,
                            training_months: candidate.trainingMonths,
                            probation_months: candidate.probationMonths,
                            post_probation_months: candidate.postProbationMonths,
                            employee_type: candidate.employeeType || 'Internship'
                        });

                    if (insertError) throw insertError;

                    results.push({ candidateName: candidate.candidateName, success: true });
                }
            } catch (err) {
                results.push({ candidateName: candidate.candidateName, success: false, error: err.message });
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
        if (!toEmail || !candidateName || !pdfBase64) return res.status(400).json({ message: 'Missing fields' });

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
            ccList.push({ email: 'gokulnath96880@gmail.com' });
        }

        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: {
                name: process.env.BREVO_SENDER_NAME || 'VTAB Admin',
                email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER
            },
            to: [{ email: toEmail }],
            cc: ccList,
            subject: customSubject || 'Policy Agreement',
            textContent: customMailContent || `Dear ${candidateName}, Please find your policy agreement attached.`,
            attachment: [{ content: base64Content, name: customFileName || `${candidateName}_PolicyAgreement.pdf` }],
        }, {
            headers: { 'api-key': process.env.BREVO_API_KEY },
        });

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

module.exports = router;
