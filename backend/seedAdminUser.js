import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const ADMIN_EMAIL = 'omkarpatil2023.it@mmcoe.edu.in';

const seedAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');


        // Delete existing account (alumni or any role) for this email
        const deleted = await User.deleteOne({ email: ADMIN_EMAIL });
        if (deleted.deletedCount > 0) {
            console.log(`Deleted existing account for ${ADMIN_EMAIL}`);
        }

        // Create fresh admin account
        const adminUser = await User.create({
            name: 'Omkar Patil',
            email: ADMIN_EMAIL,
            role: 'admin',
            isAdmin: true,
            isVerified: true,
            isProfileComplete: true,
        });

        console.log(`Admin account created: ${adminUser.email} (role: ${adminUser.role})`);
        console.log('You can now log in with OTP at /signin');
        process.exit();
    } catch (error) {
        console.error('Error:', error);

        const user = await User.findOne({ email: ADMIN_EMAIL });

        if (!user) {
            // Create the user with alumni role + isAdmin flag if they don't exist yet
            await User.create({
                name: 'Omkar Patil',
                email: ADMIN_EMAIL,
                role: 'alumni',
                isAdmin: true,
                isVerified: true,
                isProfileComplete: true,
            });
            console.log(`Created new user ${ADMIN_EMAIL} with alumni role and admin access.`);
        } else {
            // Existing alumni user — just grant admin access
            user.isAdmin = true;
            await user.save();
            console.log(`Granted admin access to existing user: ${ADMIN_EMAIL} (role: ${user.role})`);
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);

        process.exit(1);
    }
};

seedAdminUser();
