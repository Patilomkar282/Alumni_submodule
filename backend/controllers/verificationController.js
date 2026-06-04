import User from '../models/User.js';
import VerificationRequest from '../models/VerificationRequest.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';

// ─── ALUMNI ENDPOINTS ─────────────────────────────────────────────────────────

// @desc    Alumni submits a verification request
// @route   POST /api/verification/submit
// @access  Private (Alumni only)
export const submitVerificationRequest = async (req, res) => {
    try {
        const alumni = await User.findById(req.user._id);
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(403).json({ message: 'Only alumni can submit verification requests.' });
        }

        if (alumni.isVerified) {
            return res.status(400).json({ message: 'Your profile is already verified.' });
        }

        const { linkedinUrl, currentCompany, currentRole, graduationYear, branch, documents, additionalNotes } = req.body;

        // Upsert: allow re-submission if previously rejected
        const existing = await VerificationRequest.findOne({ alumni: req.user._id });
        if (existing && existing.status === 'pending') {
            return res.status(400).json({ message: 'You already have a pending verification request.' });
        }

        let request;
        if (existing) {
            // Re-submission after rejection
            existing.status = 'pending';
            existing.linkedinUrl = linkedinUrl;
            existing.currentCompany = currentCompany;
            existing.currentRole = currentRole;
            existing.graduationYear = graduationYear;
            existing.branch = branch;
            existing.documents = documents || [];
            existing.additionalNotes = additionalNotes;
            existing.adminNotes = undefined;
            existing.reviewedBy = undefined;
            existing.reviewedAt = undefined;
            request = await existing.save();
        } else {
            request = await VerificationRequest.create({
                alumni: req.user._id,
                linkedinUrl,
                currentCompany,
                currentRole,
                graduationYear,
                branch,
                documents: documents || [],
                additionalNotes
            });
        }

        // Notify admin(s)
        const admins = await User.find({ $or: [{ role: 'admin' }, { isAdmin: true }] }).select('_id');
        await Promise.all(admins.map(admin =>
            Notification.create({
                recipient: admin._id,
                sender: req.user._id,
                type: 'verification_submitted',
                message: `${alumni.name} has submitted a verification request.`,
                relatedId: request._id
            })
        ));

        res.status(201).json({ message: 'Verification request submitted successfully.', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Alumni checks their own verification status
// @route   GET /api/verification/status
// @access  Private (Alumni only)
export const getMyVerificationStatus = async (req, res) => {
    try {
        const request = await VerificationRequest.findOne({ alumni: req.user._id })
            .populate('reviewedBy', 'name');

        const user = await User.findById(req.user._id).select('isVerified');

        res.json({
            isVerified: user.isVerified,
            request: request || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

// @desc    Admin gets all verification requests (filterable by status)
// @route   GET /api/admin/verification
// @access  Private (Admin only)
export const getVerificationQueue = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const requests = await VerificationRequest.find(query)
            .populate('alumni', 'name email profilePhoto branch graduationYear company currentPosition isVerified')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin reviews (approves/rejects) a verification request
// @route   PUT /api/admin/verification/:id/review
// @access  Private (Admin only)
export const reviewVerification = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be "verified" or "rejected".' });
        }

        const request = await VerificationRequest.findById(req.params.id).populate('alumni');
        if (!request) return res.status(404).json({ message: 'Verification request not found.' });

        request.status = status;
        request.adminNotes = adminNotes || '';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();

        // Update the alumni user's isVerified flag
        const alumni = await User.findById(request.alumni._id);
        if (status === 'verified') {
            alumni.isVerified = true;
        } else {
            alumni.isVerified = false;
        }
        await alumni.save();

        // Notify the alumni
        await Notification.create({
            recipient: request.alumni._id,
            sender: req.user._id,
            type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
            message: status === 'verified'
                ? 'Congratulations! Your profile has been verified. You now have a Verified Mentor Badge.'
                : `Your verification request was not approved. ${adminNotes ? 'Reason: ' + adminNotes : 'Please review and resubmit.'}`,
            relatedId: request._id
        });

        // Send email to alumni
        const emailSubject = status === 'verified'
            ? 'Your MMCOE Connect profile is now Verified!'
            : 'Update on your MMCOE Connect Verification Request';

        const emailHtml = status === 'verified'
            ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
                <h2 style="color:#4f46e5;text-align:center;">MMCOE Connect</h2>
                <p>Hello <strong>${alumni.name}</strong>,</p>
                <p>We're delighted to inform you that your alumni profile has been <strong style="color:#10b981;">verified</strong>!</p>
                <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
                    <span style="font-size:24px;">✅ Verified Mentor Badge Granted</span>
                </div>
                <p>Your profile will now display a Verified Mentor Badge, building trust with students who seek mentorship.</p>
                <hr style="border:0;border-top:1px solid #e0e0e0;margin:20px 0;">
                <p style="font-size:12px;color:#6b7280;text-align:center;">MMCOE Connect - Your Career Hub</p>
               </div>`
            : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
                <h2 style="color:#4f46e5;text-align:center;">MMCOE Connect</h2>
                <p>Hello <strong>${alumni.name}</strong>,</p>
                <p>After reviewing your verification request, we were unable to approve it at this time.</p>
                ${adminNotes ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:20px 0;"><strong>Reason:</strong> ${adminNotes}</div>` : ''}
                <p>Please update your submitted information and resubmit your request.</p>
                <hr style="border:0;border-top:1px solid #e0e0e0;margin:20px 0;">
                <p style="font-size:12px;color:#6b7280;text-align:center;">MMCOE Connect - Your Career Hub</p>
               </div>`;

        try {
            await sendEmail({
                email: alumni.email,
                subject: emailSubject,
                message: emailSubject,
                html: emailHtml
            });
        } catch (emailErr) {
            console.error('Verification email failed:', emailErr.message);
        }

        res.json({ message: `Verification ${status} successfully.`, request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin gets count summary for dashboard badge
// @route   GET /api/admin/verification/stats
// @access  Private (Admin only)
export const getVerificationStats = async (req, res) => {
    try {
        const pending = await VerificationRequest.countDocuments({ status: 'pending' });
        const verified = await VerificationRequest.countDocuments({ status: 'verified' });
        const rejected = await VerificationRequest.countDocuments({ status: 'rejected' });
        res.json({ pending, verified, rejected, total: pending + verified + rejected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
