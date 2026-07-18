require('dotenv').config();
const mongoose = require('mongoose');
const supabase = require('./config/supabase');

// Import MongoDB Models
const Admin = require('./models/Admin');
const User = require('./models/User');
const Offer = require('./models/Offer');
const Otp = require('./models/Otp');
const PolicyAgreement = require('./models/PolicyAgreement');
const ProbationConfirmation = require('./models/ProbationConfirmation');
const RelievingExperience = require('./models/RelievingExperience');
const SalaryHike = require('./models/SalaryHike');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is missing in your environment/dotenv file!');
    process.exit(1);
}

const clean = (val) => (val === undefined ? null : val);

async function migrate() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        // 1. Migrate Admins
        console.log('\n📊 Migrating Admins...');
        const admins = await Admin.find().lean();
        console.log(`Found ${admins.length} admins in MongoDB.`);
        if (admins.length > 0) {
            const rows = admins.map(a => ({
                email: a.email.toLowerCase(),
                employee_id: clean(a.employeeId),
                password: a.password,
                reset_otp: clean(a.resetOtp),
                reset_otp_expiry: clean(a.resetOtpExpiry),
                created_at: a.createdAt || new Date(),
                updated_at: a.updatedAt || new Date()
            }));
            const { error } = await supabase.from('admins').upsert(rows, { onConflict: 'email' });
            if (error) console.error('❌ Error migrating admins:', error.message);
            else console.log('✅ Admins migrated successfully.');
        }

        // 2. Migrate Users
        console.log('\n📊 Migrating Users...');
        const users = await User.find().lean();
        console.log(`Found ${users.length} users in MongoDB.`);
        if (users.length > 0) {
            const rows = users.map(u => ({
                email: u.email.toLowerCase(),
                password: clean(u.password),
                temp_password: u.tempPassword,
                is_temp_password_expired: u.isTempPasswordExpired || false,
                is_verified: u.isVerified || false,
                face_data: clean(u.faceData),
                user_id: u.userId,
                union_number: clean(u.unionNumber),
                face_verification_token: clean(u.faceVerificationToken),
                created_at: u.createdAt || new Date(),
                updated_at: u.updatedAt || new Date()
            }));
            const { error } = await supabase.from('users').upsert(rows, { onConflict: 'email' });
            if (error) console.error('❌ Error migrating users:', error.message);
            else console.log('✅ Users migrated successfully.');
        }

        // 3. Migrate Offers
        console.log('\n📊 Migrating Offers...');
        const offers = await Offer.find().lean();
        console.log(`Found ${offers.length} offers in MongoDB.`);
        if (offers.length > 0) {
            const rows = offers.map(o => ({
                candidate_name: o.candidateName,
                door_no: clean(o.doorNo),
                street: clean(o.street),
                address_line1: clean(o.addressLine1),
                address_line2: clean(o.addressLine2),
                district: clean(o.district),
                state: clean(o.state),
                pincode: clean(o.pincode),
                designation: clean(o.designation),
                joining_date: clean(o.joiningDate),
                reporting_manager: clean(o.reportingManager),
                location: clean(o.location),
                offer_date: clean(o.offerDate),
                drive_file_id: o.driveFileId,
                drive_link: o.driveLink,
                created_at: o.createdAt || new Date(),
                updated_at: o.updatedAt || new Date()
            }));
            const { error } = await supabase.from('offers').upsert(rows, { onConflict: 'drive_file_id' });
            if (error) console.error('❌ Error migrating offers:', error.message);
            else console.log('✅ Offers migrated successfully.');
        }

        // 4. Migrate Otps
        console.log('\n📊 Migrating Otps...');
        const otps = await Otp.find().lean();
        console.log(`Found ${otps.length} OTPs in MongoDB.`);
        if (otps.length > 0) {
            const rows = otps.map(o => ({
                otp: o.otp,
                created_at: o.createdAt || new Date()
            }));
            const { error } = await supabase.from('otps').upsert(rows);
            if (error) console.error('❌ Error migrating OTPs:', error.message);
            else console.log('✅ OTPs migrated successfully.');
        }

        // 5. Migrate Policy Agreements
        console.log('\n📊 Migrating Policy Agreements...');
        const policies = await PolicyAgreement.find().lean();
        console.log(`Found ${policies.length} policy agreements in MongoDB.`);
        if (policies.length > 0) {
            const rows = policies.map(p => ({
                candidate_name: p.candidateName,
                stipend: clean(p.stipend),
                probation_salary: clean(p.probationSalary),
                post_probation_salary: clean(p.postProbationSalary),
                work_start_time: clean(p.workStartTime),
                work_end_time: clean(p.workEndTime),
                internship_months: clean(p.internshipMonths),
                training_months: clean(p.trainingMonths),
                probation_months: clean(p.probationMonths),
                post_probation_months: clean(p.postProbationMonths),
                employee_type: p.employeeType || 'Internship',
                drive_file_id: p.driveFileId,
                drive_link: p.driveLink,
                created_at: p.createdAt || new Date(),
                updated_at: p.updatedAt || new Date()
            }));
            const { error } = await supabase.from('policy_agreements').upsert(rows, { onConflict: 'drive_file_id' });
            if (error) console.error('❌ Error migrating policy agreements:', error.message);
            else console.log('✅ Policy agreements migrated successfully.');
        }

        // 6. Migrate Probation Confirmations
        console.log('\n📊 Migrating Probation Confirmations...');
        const probations = await ProbationConfirmation.find().lean();
        console.log(`Found ${probations.length} probation confirmations in MongoDB.`);
        if (probations.length > 0) {
            const rows = probations.map(pr => ({
                employee_name: pr.employeeName,
                effective_date: clean(pr.effectiveDate),
                door_no: clean(pr.doorNo),
                street: clean(pr.street),
                address_line1: clean(pr.addressLine1),
                address_line2: clean(pr.addressLine2),
                district: clean(pr.district),
                state: clean(pr.state),
                pincode: clean(pr.pincode),
                designation: clean(pr.designation),
                reporting_manager: clean(pr.reportingManager),
                annual_hike: clean(pr.annualHike),
                planned_leaves: clean(pr.plannedLeaves),
                annual_package: clean(pr.annualPackage),
                drive_file_id: pr.driveFileId,
                drive_link: pr.driveLink,
                created_at: pr.createdAt || new Date(),
                updated_at: pr.updatedAt || new Date()
            }));
            const { error } = await supabase.from('probation_confirmations').upsert(rows, { onConflict: 'drive_file_id' });
            if (error) console.error('❌ Error migrating probation confirmations:', error.message);
            else console.log('✅ Probation confirmations migrated successfully.');
        }

        // 7. Migrate Relieving Experiences
        console.log('\n📊 Migrating Relieving Experiences...');
        const relievings = await RelievingExperience.find().lean();
        console.log(`Found ${relievings.length} relieving experiences in MongoDB.`);
        if (relievings.length > 0) {
            const rows = relievings.map(r => ({
                employee_name: r.employeeName,
                employee_id: clean(r.employeeId),
                job_title: clean(r.jobTitle),
                business_title: clean(r.businessTitle),
                issue_date: clean(r.issueDate),
                joined_date: clean(r.joinedDate),
                relieving_date: clean(r.relievingDate),
                drive_file_id: r.driveFileId,
                drive_link: r.driveLink,
                created_at: r.createdAt || new Date(),
                updated_at: r.updatedAt || new Date()
            }));
            const { error } = await supabase.from('relieving_experiences').upsert(rows, { onConflict: 'drive_file_id' });
            if (error) console.error('❌ Error migrating relieving experiences:', error.message);
            else console.log('✅ Relieving experiences migrated successfully.');
        }

        // 8. Migrate Salary Hikes
        console.log('\n📊 Migrating Salary Hikes...');
        const hikes = await SalaryHike.find().lean();
        console.log(`Found ${hikes.length} salary hikes in MongoDB.`);
        if (hikes.length > 0) {
            const rows = hikes.map(sh => ({
                employee_name: sh.employeeName,
                door_no: clean(sh.doorNo),
                street: clean(sh.street),
                address_line1: clean(sh.addressLine1),
                address_line2: clean(sh.addressLine2),
                district: clean(sh.district),
                state: clean(sh.state),
                pincode: clean(sh.pincode),
                new_salary: clean(sh.newSalary),
                effective_date: clean(sh.effectiveDate),
                date: clean(sh.date),
                drive_file_id: sh.driveFileId,
                drive_link: sh.driveLink,
                created_at: sh.createdAt || new Date(),
                updated_at: sh.updatedAt || new Date()
            }));
            const { error } = await supabase.from('salary_hikes').upsert(rows, { onConflict: 'drive_file_id' });
            if (error) console.error('❌ Error migrating salary hikes:', error.message);
            else console.log('✅ Salary hikes migrated successfully.');
        }

        console.log('\n🎉 ALL DATA MIGRATION TASKS COMPLETED!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed with critical error:', err);
        process.exit(1);
    }
}

migrate();
