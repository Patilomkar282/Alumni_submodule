import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { getRedisClient } from '../config/redisClient.js';
import sendEmail from '../utils/sendEmail.js';
import { welcomeEmailTemplate, profileUnderReviewTemplate } from '../utils/emailTemplates.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt instead of Math.random (which is NOT cryptographically secure).
 */
const generateSecureOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Sanitise error responses — never leak stack traces or internal messages to clients.
 */
const serverError = (res, error, label = 'Operation') => {
    console.error(`[${label} Error]`, error?.message || error);
    return res.status(500).json({ message: 'An internal server error occurred. Please try again.' });
};

// Basic email format check (Joi/express-validator is preferred for complex validation)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Minimum password policy: 8+ chars, 1 uppercase, 1 digit
const isStrongPassword = (password) =>
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

// ─── Controllers ──────────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, role, college, company } = req.body;

    // Input validation
    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: 'A valid email address is required.' });
    }

    // Normalise email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Allowed roles (never accept 'admin' from public registration)
    const allowedRoles = ['student', 'alumni'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    try {
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists. Please Sign In.' });
        }

        // Email Domain Validation for Students
        if (assignedRole === 'student' && !normalizedEmail.endsWith('@mmcoe.edu.in')) {
            return res.status(400).json({ message: 'Please use your college email (@mmcoe.edu.in) to register.' });
        }

        const userData = {
            name: (name || normalizedEmail.split('@')[0]).trim(),
            email: normalizedEmail,
            role: assignedRole,
        };

        if (assignedRole === 'student' && college) userData.college = college;
        if (assignedRole === 'alumni' && company) userData.company = company;

        const user = await User.create(userData);

        if (user) {
            // Send welcome email (non-blocking)
            const { subject, html } = welcomeEmailTemplate(user.name, user.role);
            sendEmail({ email: user.email, subject, html }).catch((err) =>
                console.error('[Email] Welcome email failed:', err.message)
            );

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data.' });
        }
    } catch (error) {
        return serverError(res, error, 'Register');
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email: normalizedEmail });

        // Use a constant-time comparison path to avoid user-enumeration via timing.
        // Always call bcrypt even when the user doesn't exist (dummy hash).
        const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
        const hashToCompare = user ? user.password : DUMMY_HASH;
        const passwordMatch = user?.password
            ? await bcrypt.compare(password, hashToCompare)
            : false;

        if (!user || !passwordMatch) {
            // Generic message — do NOT reveal whether the email exists
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto,
            bannerPhoto: user.bannerPhoto,
            headline: user.headline,
            location: user.location,
            role: user.role,
            isProfileComplete: user.isProfileComplete,
            token: generateToken(user._id),
        });
    } catch (error) {
        return serverError(res, error, 'Login');
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -resetOTP -loginOTP');

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                profilePhoto: user.profilePhoto,
                bio: user.bio,
                currentPosition: user.currentPosition,
                company: user.company,
                graduationYear: user.graduationYear,
                branch: user.branch,
                location: user.location,
                linkedinUrl: user.linkedinUrl,
                githubUrl: user.githubUrl,
                portfolioUrl: user.portfolioUrl,
                headline: user.headline,
                skills: user.skills,
                expertiseAreas: user.expertiseAreas,
                college: user.college,
                currentYear: user.currentYear,
                interestAreas: user.interestAreas,
                experience: user.experience,
                education: user.education,
                isPublic: user.isPublic,
                emailAlerts: user.emailAlerts,
                pushNotifications: user.pushNotifications,
                bannerPhoto: user.bannerPhoto,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        return serverError(res, error, 'GetProfile');
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // SECURITY: Do NOT allow email or role changes here.
        // Email changes require re-verification; role changes are admin-only.
        user.name = req.body.name || user.name;

        // Update profile fields
        user.profilePhoto = req.body.profilePhoto || user.profilePhoto;
        user.bannerPhoto = req.body.bannerPhoto || user.bannerPhoto;
        user.bio = req.body.bio || user.bio;
        user.location = req.body.location || user.location;
        user.linkedinUrl = req.body.linkedinUrl || user.linkedinUrl;
        user.githubUrl = req.body.githubUrl || user.githubUrl;
        user.portfolioUrl = req.body.portfolioUrl || user.portfolioUrl;
        user.headline = req.body.headline || user.headline;
        user.skills = req.body.skills || user.skills;
        user.experience = req.body.experience || user.experience;
        user.education = req.body.education || user.education;

        if (req.body.isPublic !== undefined) {
            user.isPublic = req.body.isPublic;
        }
        if (req.body.emailAlerts !== undefined) {
            user.emailAlerts = req.body.emailAlerts;
        }
        if (req.body.pushNotifications !== undefined) {
            user.pushNotifications = req.body.pushNotifications;
        }

        // Alumni specific
        user.currentPosition = req.body.currentPosition || user.currentPosition;
        user.company = req.body.company || user.company;
        user.graduationYear = req.body.graduationYear || user.graduationYear;
        user.branch = req.body.branch || user.branch;
        user.expertiseAreas = req.body.expertiseAreas || user.expertiseAreas;

        // Student specific
        user.college = req.body.college || user.college;
        user.currentYear = req.body.currentYear || user.currentYear;
        user.interestAreas = req.body.interestAreas || user.interestAreas;

        // Profile completion logic
        const wasProfileComplete = user.isProfileComplete;
        if (user.role === 'alumni' && user.currentPosition && user.company) {
            user.isProfileComplete = true;
        } else if (user.role === 'student' && user.college && user.branch) {
            user.isProfileComplete = true;
        }
        const justCompleted = !wasProfileComplete && user.isProfileComplete;

        const updatedUser = await user.save();

        // Send "under review" email only the first time the profile is completed
        if (justCompleted) {
            const { subject, html } = profileUnderReviewTemplate(updatedUser.name, updatedUser.role);
            sendEmail({ email: updatedUser.email, subject, html }).catch((err) =>
                console.error('[Email] Profile review email failed:', err.message)
            );
        }

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            profilePhoto: updatedUser.profilePhoto,
            bannerPhoto: updatedUser.bannerPhoto,
            headline: updatedUser.headline,
            location: updatedUser.location,
            role: updatedUser.role,
            isAdmin: updatedUser.isAdmin,
            isProfileComplete: updatedUser.isProfileComplete,
            isVerified: updatedUser.isVerified,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        return serverError(res, error, 'UpdateProfile');
    }
};

// @desc    Get users by role
// @route   GET /api/auth/users
// @access  Private
export const getUsersByRole = async (req, res) => {
    const { role, search = '' } = req.query;

    // Validate and clamp pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    try {
        const query = role ? { role } : {};
        let projection = { password: 0, resetOTP: 0, loginOTP: 0 };
        let sortOption = { createdAt: -1 };

        if (search) {
            query.$text = { $search: search };
            projection.score = { $meta: "textScore" };
            sortOption = { score: { $meta: "textScore" } };
        }

        const cacheKey = `users:${role || 'all'}:page:${page}:limit:${limit}:search:${search}`;
        const redisClient = getRedisClient();

        if (redisClient) {
            const cachedUsers = await redisClient.get(cacheKey);
            if (cachedUsers) {
                return res.json(JSON.parse(cachedUsers));
            }
        }

        const skip = (page - 1) * limit;

        const users = await User.find(query, projection)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();

        if (redisClient) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(users));
        }

        res.json(users);
    } catch (error) {
        return serverError(res, error, 'GetUsersByRole');
    }
};

// @desc    Initiate forgot password (generates and sends OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // SECURITY: Always return the same response to prevent email enumeration.
    // Whether or not the user exists, respond with 200.
    const GENERIC_RESPONSE = { success: true, message: 'If this email is registered, an OTP will be sent shortly.' };

    try {
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Do NOT reveal that the user doesn't exist
            return res.status(200).json(GENERIC_RESPONSE);
        }

        // Generate cryptographically secure 6-digit OTP
        const otp = generateSecureOTP();

        // Store hashed OTP (never store OTPs in plaintext)
        user.resetOTP = await bcrypt.hash(otp, 10);
        user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const message = `Your password reset OTP for MMCOE Connect is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4f46e5; text-align: center;">MMCOE Connect</h2>
                <p>Hello,</p>
                <p>You requested a password reset. Please use the following One-Time Password (OTP) to reset your password:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
                    ${otp}
                </div>
                <p style="margin-top: 20px;">This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">MMCOE Connect - Your Career Hub</p>
            </div>
        `;

        try {
            await sendEmail({ email: user.email, subject: 'Password Reset OTP - MMCOE Connect', message, html });
        } catch (emailError) {
            // Clear OTP on email failure but keep generic response
            user.resetOTP = undefined;
            user.resetOTPExpires = undefined;
            await user.save();
            console.error('[ForgotPassword] Email send error:', emailError?.message);
        }

        return res.status(200).json(GENERIC_RESPONSE);
    } catch (error) {
        return serverError(res, error, 'ForgotPassword');
    }
};

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        // Find user by email and check expiry separately (don't match OTP in DB query — use bcrypt compare)
        const user = await User.findOne({
            email: normalizedEmail,
            resetOTPExpires: { $gt: Date.now() },
        });

        if (!user || !user.resetOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Constant-time comparison via bcrypt
        const isValid = await bcrypt.compare(otp, user.resetOTP);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } catch (error) {
        return serverError(res, error, 'VerifyOTP');
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters and contain at least one uppercase letter and one number.',
        });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({
            email: normalizedEmail,
            resetOTPExpires: { $gt: Date.now() },
        });

        if (!user || !user.resetOTP) {
            return res.status(400).json({ message: 'Invalid request or OTP expired. Please start over.' });
        }

        const isValid = await bcrypt.compare(otp, user.resetOTP);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid request or OTP expired. Please start over.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12); // Increased cost factor from 10 to 12
        user.password = await bcrypt.hash(password, salt);

        // Clear OTP fields
        user.resetOTP = undefined;
        user.resetOTPExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        return serverError(res, error, 'ResetPassword');
    }
};

// @desc    Initiate OTP login (generates and sends OTP)
// @route   POST /api/auth/login-otp
// @access  Public
export const sendLoginOTP = async (req, res) => {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // SECURITY: Same generic response regardless of whether email exists
    const GENERIC_RESPONSE = { success: true, message: 'If this email is registered, a login OTP will be sent shortly.' };

    try {
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(200).json(GENERIC_RESPONSE);
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
        }

        // Generate cryptographically secure OTP
        const otp = generateSecureOTP();

        user.loginOTP = await bcrypt.hash(otp, 10);
        user.loginOTPExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const message = `Your login OTP for MMCOE Connect is: ${otp}\n\nThis OTP is valid for 10 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4f46e5; text-align: center;">MMCOE Connect Login</h2>
                <p>Hello,</p>
                <p>Use the following One-Time Password (OTP) to securely log in to your account:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
                    ${otp}
                </div>
                <p style="margin-top: 20px;">This OTP will expire in 10 minutes.</p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280; text-align: center;">MMCOE Connect - Your Career Hub</p>
            </div>
        `;

        try {
            await sendEmail({ email: user.email, subject: 'Login OTP - MMCOE Connect', message, html });
        } catch (emailError) {
            user.loginOTP = undefined;
            user.loginOTPExpires = undefined;
            await user.save();
            console.error('[SendLoginOTP] Email send error:', emailError?.message);
        }

        return res.status(200).json(GENERIC_RESPONSE);
    } catch (error) {
        return serverError(res, error, 'SendLoginOTP');
    }
};

// @desc    Verify OTP and Login
// @route   POST /api/auth/verify-login-otp
// @access  Public
export const verifyLoginOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const user = await User.findOne({
            email: normalizedEmail,
            loginOTPExpires: { $gt: Date.now() },
        });

        if (!user || !user.loginOTP) {
            return res.status(401).json({ message: 'Invalid or expired OTP.' });
        }

        const isValid = await bcrypt.compare(otp, user.loginOTP);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid or expired OTP.' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
        }

        // Clear OTP fields
        user.loginOTP = undefined;
        user.loginOTPExpires = undefined;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto,
            bannerPhoto: user.bannerPhoto,
            headline: user.headline,
            location: user.location,
            role: user.role,
            isAdmin: user.isAdmin,
            isProfileComplete: user.isProfileComplete,
            isVerified: user.isVerified,
            token: generateToken(user._id),
        });
    } catch (error) {
        return serverError(res, error, 'VerifyLoginOTP');
    }
};

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Google token is required.' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        const normalizedEmail = email.toLowerCase().trim();

        // Force MMCOE domain check
        if (!normalizedEmail.endsWith('@mmcoe.edu.in')) {
            return res.status(403).json({ message: 'Access denied: Please sign in with your @mmcoe.edu.in account.' });
        }

        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Generate a cryptographically random password for Google-auth users
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = await User.create({
                name,
                email: normalizedEmail,
                profilePhoto: picture,
                password: hashedPassword,
                role: 'student',
            });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            headline: user.headline,
            location: user.location,
            profilePhoto: user.profilePhoto,
            bannerPhoto: user.bannerPhoto,
            isProfileComplete: user.isProfileComplete,
            token: generateToken(user._id),
        });
    } catch (error) {
        // Don't expose internal Google verification errors
        return res.status(401).json({ message: 'Google authentication failed. Please try again.' });
    }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required.' });
    }

    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
            message: 'New password must be at least 8 characters and contain at least one uppercase letter and one number.',
        });
    }

    try {
        const user = await User.findById(req.user._id);

        if (user && (await bcrypt.compare(oldPassword, user.password))) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
            res.json({ message: 'Password updated successfully.' });
        } else {
            res.status(401).json({ message: 'Current password is incorrect.' });
        }
    } catch (error) {
        return serverError(res, error, 'ChangePassword');
    }
};

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'Account deleted successfully.' });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        return serverError(res, error, 'DeleteAccount');
    }
};

// @desc    Get AI-based Mentor Recommendations for Students
// @route   GET /api/auth/users/recommendations
// @access  Private (Students only)
export const getMentorRecommendations = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);

        if (!student || student.role !== 'student') {
            return res.status(403).json({ message: 'Only students can get recommendations.' });
        }

        const searchTerms = [
            ...(student.interestAreas || []),
            ...(student.skills || []),
            student.branch || '',
        ].filter(Boolean).join(' ');

        if (!searchTerms.trim()) {
            const fallbackMentors = await User.find({ role: 'alumni' })
                .select('-password -resetOTP -loginOTP')
                .sort({ rating: -1, createdAt: -1 })
                .limit(4)
                .lean();
            return res.json(fallbackMentors);
        }

        const query = { role: 'alumni', $text: { $search: searchTerms } };

        const recommendedMentors = await User.find(
            query,
            { score: { $meta: 'textScore' } }
        )
            .select('-password -resetOTP -loginOTP')
            .sort({ score: { $meta: 'textScore' } })
            .limit(6)
            .lean();

        if (recommendedMentors.length === 0) {
            const fallbackMentors = await User.find({ role: 'alumni' })
                .select('-password -resetOTP -loginOTP')
                .sort({ rating: -1, createdAt: -1 })
                .limit(4)
                .lean();
            return res.json(fallbackMentors);
        }

        res.json(recommendedMentors);
    } catch (error) {
        return serverError(res, error, 'GetMentorRecommendations');
    }
};
