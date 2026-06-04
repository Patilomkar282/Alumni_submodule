import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const ADMIN_EMAIL  = 'omkarpatil2023.it@mmcoe.edu.in';
const OLD_EMAIL    = 'admin@mmcoe.edu';

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected…');

        // ── 1. Remove the old dummy admin account if it still exists ─────────
        const oldAdmin = await User.findOne({ email: OLD_EMAIL });
        if (oldAdmin) {
            await User.deleteOne({ email: OLD_EMAIL });
            console.log(`Removed legacy admin account: ${OLD_EMAIL}`);
        }

        // ── 2. Check whether the target email already exists (e.g. as alumni) ─
        const existingUser = await User.findOne({ email: ADMIN_EMAIL });

        if (existingUser) {
            // Promote the existing account to admin — preserve all profile data
            existingUser.role             = 'admin';
            existingUser.isVerified       = true;
            existingUser.isProfileComplete = true;
            await existingUser.save();

            console.log('─────────────────────────────────────────────');
            console.log('✅  Existing account promoted to admin.');
            console.log(`👤  Name  : ${existingUser.name}`);
            console.log(`📧  Email : ${existingUser.email}`);
            console.log(`🔑  Role  : ${existingUser.role}`);
            console.log('─────────────────────────────────────────────');
        } else {
            // Create a brand-new admin account (no plain-text password needed
            // because login is OTP-based; we store a random placeholder hash)
            const crypto = await import('crypto');
            const randomPass = crypto.randomBytes(32).toString('hex');
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash(randomPass, 12);

            const adminUser = await User.create({
                name:              'System Admin',
                email:             ADMIN_EMAIL,
                password:          hashedPassword,
                role:              'admin',
                isProfileComplete: true,
                isVerified:        true,
            });

            console.log('─────────────────────────────────────────────');
            console.log('✅  New admin account created.');
            console.log(`📧  Email : ${adminUser.email}`);
            console.log(`🔑  Role  : ${adminUser.role}`);
            console.log('─────────────────────────────────────────────');
        }

        console.log('');
        console.log('🔐  Admin login:');
        console.log(`    Go to Sign In → enter  ${ADMIN_EMAIL}`);
        console.log('    An OTP will be sent to that email address.');
        console.log('    Enter the OTP → you will be redirected to /admin/dashboard.');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
