import User from '../models/User.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import Report from '../models/Report.js';
import Announcement from '../models/Announcement.js';
import sendEmail from '../utils/sendEmail.js';
import { verificationApprovedTemplate, verificationRejectedTemplate, bulkInviteTemplate } from '../utils/emailTemplates.js';

// @desc    Get all users (Students & Alumni)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password -resetOTP -resetOTPExpires -loginOTP -loginOTPExpires')
            .sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// @desc    Suspend/Unsuspend user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
export const toggleSuspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isSuspended = !user.isSuspended;
        user.status = user.isSuspended ? 'suspended' : 'active';
        await user.save();

        res.status(200).json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status' });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// @desc    Verify Alumni Profile
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
export const verifyAlumni = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'alumni') return res.status(404).json({ message: 'Alumni not found' });

        user.isVerified = !user.isVerified;
        await user.save();

        // Send verification outcome email (non-blocking)
        if (user.isVerified) {
            const { subject, html } = verificationApprovedTemplate(user.name, user.role);
            sendEmail({ email: user.email, subject, html }).catch((err) =>
                console.error('[Email] Verification approved email failed:', err.message)
            );
        } else {
            const { subject, html } = verificationRejectedTemplate(user.name);
            sendEmail({ email: user.email, subject, html }).catch((err) =>
                console.error('[Email] Verification rejected email failed:', err.message)
            );
        }

        res.status(200).json({ message: `Alumni ${user.isVerified ? 'verified' : 'unverified'}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying alumni' });
    }
};

// @desc    Update user details by Admin
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUserByAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, role, branch, company, currentPosition } = req.body;

        // SECURITY: Admin cannot escalate a user's role to 'admin' via this endpoint.
        // Admin accounts should be created only via the seedAdmin script.
        const allowedRoles = ['student', 'alumni'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Allowed values: student, alumni.' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        if (role) user.role = role;
        user.branch = branch || user.branch;
        user.company = company || user.company;
        user.currentPosition = currentPosition || user.currentPosition;

        const updatedUser = await user.save();
        // Return user without sensitive fields
        const userObj = updatedUser.toObject();
        delete userObj.password;
        delete userObj.resetOTP;
        delete userObj.resetOTPExpires;
        delete userObj.loginOTP;
        delete userObj.loginOTPExpires;

        res.status(200).json(userObj);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// @desc    Get user's platform stats for Admin
// @route   GET /api/admin/users/:id/stats
// @access  Private/Admin
export const getUserStatsByAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        const connectionCount = await ConnectionRequest.countDocuments({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
        });

        const messagesCount = await Message.countDocuments({
            $or: [{ sender: userId }, { recipient: userId }]
        });

        res.status(200).json({
            connections: connectionCount,
            messages: messagesCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

// @desc    Admin schedules a global session (broadcast webinar)
// @route   POST /api/admin/sessions
// @access  Private/Admin
export const createGlobalSession = async (req, res) => {
    try {
        const { title, description, date, startTime, endTime, hostId, agenda, meetLink } = req.body;

        const session = await Session.create({
            title,
            description,
            agenda,
            date,
            startTime,
            endTime,
            host: hostId,
            isGlobal: true,
            meetLink: meetLink || `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
        });

        // Populate host and send back
        const populatedSession = await session.populate('host', 'name email profilePhoto');
        res.status(201).json(populatedSession);
    } catch (error) {
        res.status(500).json({ message: 'Error scheduling session' });
    }
};

// @desc    Get all sessions for Admin
// @route   GET /api/admin/sessions
// @access  Private/Admin
export const getAllSessionsByAdmin = async (req, res) => {
    try {
        let sessions = await Session.find()
            .populate('host', 'name email profilePhoto')
            .populate('student', 'name email profilePhoto')
            .sort({ date: 1, startTime: 1 });

        // Auto-update status for passed sessions
        const now = new Date();
        const updatedSessions = await Promise.all(sessions.map(async (session) => {
            if (session.status === 'scheduled') {
                const [endHour, endMin] = session.endTime.split(':').map(Number);
                const sessionEnd = new Date(session.date);
                sessionEnd.setHours(endHour, endMin, 0, 0);

                if (sessionEnd < now) {
                    session.status = 'completed';
                    await session.save();
                    await User.findByIdAndUpdate(session.host._id, { $inc: { totalSessions: 1 } });
                }
            }
            return session;
        }));

        res.status(200).json(updatedSessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};
// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'name email role profilePhoto')
            .populate('reportedUser', 'name email role profilePhoto isSuspended')
            .sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

// @desc    Update report status / Resolve
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
export const resolveReport = async (req, res) => {
    try {
        const { status, actionTaken, adminNotes } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = status || report.status;
        report.actionTaken = actionTaken || report.actionTaken;
        report.adminNotes = adminNotes || report.adminNotes;
        await report.save();

        res.status(200).json({ message: 'Report updated successfully', report });
    } catch (error) {
        res.status(500).json({ message: 'Error updating report' });
    }
};

// @desc    Create Announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, attachments, scheduledAt } = req.body;
        const announcement = await Announcement.create({
            title,
            content,
            targetAudience,
            attachments,
            scheduledAt,
            author: req.user._id
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error creating announcement' });
    }
};

// @desc    Get all announcements (Admin view)
// @route   GET /api/admin/announcements
// @access  Private/Admin
export const getAllAnnouncementsByAdmin = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'name')
            .sort({ scheduledAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements' });
    }
};

// @desc    Delete Announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement' });
    }
};

// @desc    Get public announcements for users
// @route   GET /api/announcements
// @access  Private (Student/Alumni)
export const getAnnouncementsForPortal = async (req, res) => {
    try {
        const userRole = req.user.role;
        const announcements = await Announcement.find({
            targetAudience: { $in: ['all', userRole] }
        }).sort({ scheduledAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements' });
    }
};

// @desc    Broadcast a global session (Send notification to all students)
// @route   POST /api/admin/sessions/:id/broadcast
// @access  Private/Admin
export const broadcastGlobalSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('host', 'name');
        if (!session || !session.isGlobal) return res.status(404).json({ message: 'Global session not found' });

        // Get all students
        const students = await User.find({ role: 'student' }).select('_id');
        
        // Create notifications (This is a simplified broadcast)
        // In a real app, you might use a separate Notification model or push notifications
        // we'll create an announcement instead as it's already integrated
        await Announcement.create({
            title: `Broadcast: ${session.title}`,
            content: `New global event scheduled for ${new Date(session.date).toLocaleDateString()} at ${session.startTime}. Hosted by ${session.host.name}. Join link: ${session.meetLink}`,
            targetAudience: 'student',
            author: req.user._id,
            scheduledAt: new Date()
        });

        res.status(200).json({ message: 'Broadcast sent successfully via announcements' });
    } catch (error) {
        res.status(500).json({ message: 'Error broadcasting session' });
    }
};

// @desc    Get complete platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getPlatformAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
        const students = await User.countDocuments({ role: 'student' });
        const alumni = await User.countDocuments({ role: 'alumni' });
        
        const totalConnections = await ConnectionRequest.countDocuments({ status: 'accepted' });
        const totalMessages = await Message.countDocuments();
        const totalSessions = await Session.countDocuments();
        
        // Simple daily data for charts (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const dailyGrowth = await Promise.all(last7Days.map(async (date) => {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);

            const userCount = await User.countDocuments({ 
                createdAt: { $gte: start, $lt: end },
                role: { $ne: 'admin' }
            });
            const sessionCount = await Session.countDocuments({ 
                createdAt: { $gte: start, $lt: end }
            });

            return { date, users: userCount, sessions: sessionCount };
        }));

        res.status(200).json({
            stats: {
                totalUsers,
                students,
                alumni,
                totalConnections,
                totalMessages,
                totalSessions
            },
            dailyGrowth
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};

// @desc    Get accreditation report data (NBA/NAAC)
// @route   GET /api/admin/reports/accreditation
// @access  Private/Admin
export const getAccreditationReportData = async (req, res) => {
    try {
        // 1. Alumni Data (Company & Branch placements)
        const alumniList = await User.find({ role: 'alumni' })
            .select('name email company currentPosition branch graduationYear expertiseAreas isVerified');
        
        // 2. Global Sessions (Guest Lectures / Events)
        const guestLectures = await Session.find({ isGlobal: true, status: 'completed' })
            .populate('host', 'name company branch')
            .select('title date startTime registeredStudents host feedback');
            
        // 3. Mentorship Sessions (1-on-1s)
        const mentorshipSessions = await Session.find({ isGlobal: false, status: 'completed' })
            .populate('host', 'name company')
            .populate('student', 'name branch')
            .select('title date host student');

        // 4. Summarized metrics
        const totalAlumni = alumniList.length;
        const totalGuestLectures = guestLectures.length;
        const totalMentorshipSessions = mentorshipSessions.length;
        
        // Count connections
        const activeConnections = await ConnectionRequest.countDocuments({ status: 'accepted' });

        res.status(200).json({
            metrics: {
                totalAlumni,
                totalGuestLectures,
                totalMentorshipSessions,
                activeConnections
            },
            alumni: alumniList,
            guestLectures,
            mentorshipSessions
        });
    } catch (error) {
        console.error('Error fetching accreditation data:', error);
        res.status(500).json({ message: 'Error fetching accreditation data' });
    }
};

// @desc    Bulk import users from CSV
// @route   POST /api/admin/users/bulk-import
// @access  Private/Admin
export const bulkImportUsers = async (req, res) => {
    try {
        const usersData = req.body; // Expecting an array of user objects
        
        if (!Array.isArray(usersData) || usersData.length === 0) {
            return res.status(400).json({ message: 'No valid data provided for import.' });
        }

        let successCount = 0;
        let skipCount = 0;
        const errors = [];

        for (const data of usersData) {
            try {
                // Validate email
                if (!data.email) {
                    errors.push({ name: data.name || 'Unknown', error: 'Email is required' });
                    continue;
                }
                
                const normalizedEmail = data.email.toLowerCase().trim();
                const role = data.role && data.role.toLowerCase() === 'alumni' ? 'alumni' : 'student';

                // Check if user already exists
                const userExists = await User.findOne({ email: normalizedEmail });
                if (userExists) {
                    skipCount++;
                    continue;
                }

                // Prepare user data
                const userData = {
                    name: data.name ? data.name.trim() : normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    role: role,
                    // No password needed; we are enforcing OTP login
                };

                // Add optional fields
                if (role === 'student') {
                    if (data.college) userData.college = data.college.trim();
                    if (data.branch) userData.branch = data.branch.trim();
                    if (data.graduationYear) userData.currentYear = parseInt(data.graduationYear); // Or currentYear logic
                } else if (role === 'alumni') {
                    if (data.company) userData.company = data.company.trim();
                    if (data.branch) userData.branch = data.branch.trim();
                    if (data.graduationYear) userData.graduationYear = parseInt(data.graduationYear);
                    // For bulk imported alumni, we might trust them or still require verification.
                    // We'll leave isVerified = false to require profile completion first.
                }

                const user = await User.create(userData);

                // Send email invite asynchronously
                if (user) {
                    successCount++;
                    const { subject, html } = bulkInviteTemplate(user.name, user.role);
                    sendEmail({ email: user.email, subject, html }).catch((err) =>
                        console.error('[Email] Bulk invite failed for', user.email, err.message)
                    );
                }
            } catch (err) {
                console.error(`Error importing ${data.email}:`, err);
                errors.push({ email: data.email, error: err.message });
            }
        }

        res.status(200).json({
            message: 'Import completed',
            summary: {
                totalProcessed: usersData.length,
                successCount,
                skipCount,
                errorCount: errors.length
            },
            errors
        });

    } catch (error) {
        console.error('Bulk Import Error:', error);
        res.status(500).json({ message: 'Server error during bulk import' });
    }
};

