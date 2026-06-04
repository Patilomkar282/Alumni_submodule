import User from '../models/User.js';
import Report from '../models/Report.js';
import Session from '../models/Session.js';
import { getRedisClient } from '../config/redisClient.js';

/**
 * Escape special regex characters to prevent ReDoS attacks.
 * A malicious search query like `(a+)+` without escaping can cause catastrophic backtracking.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Search all users by name
// @route   GET /api/users/search?q=query
// @access  Private
export const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || typeof query !== 'string') return res.status(200).json([]);

        // Limit query length to prevent abuse
        const trimmedQuery = query.trim().slice(0, 100);
        if (!trimmedQuery) return res.status(200).json([]);

        // Escape user input before constructing regex to prevent ReDoS
        const safeRegex = new RegExp(escapeRegex(trimmedQuery), 'i');

        const users = await User.find({ name: { $regex: safeRegex } })
            .select('_id name email profilePhoto headline role')
            .limit(10);

        res.status(200).json(users);
    } catch (error) {
        console.error('[SearchUsers Error]', error?.message);
        res.status(500).json({ message: 'Server error searching users' });
    }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
};

// @desc    Get User By ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
    try {
        // Exclude sensitive OTP and password fields from all public-facing lookups
        const user = await User.findById(req.params.id).select('-password -resetOTP -resetOTPExpires -loginOTP -loginOTPExpires');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user details' });
    }
};

// @desc    Get all alumni
// @route   GET /api/users/alumni
// @access  Private (or Public depending on requirements, usually Private for logged in users)
export const getAlumni = async (req, res) => {
    try {
        const alumni = await User.find({ role: 'alumni' })
            .select('-password -resetOTP -resetOTPExpires -loginOTP -loginOTPExpires')
            .sort({ createdAt: -1 });

        res.status(200).json(alumni);
    } catch (error) {
        console.error('[GetAlumni Error]', error?.message);
        res.status(500).json({ message: 'Server error fetching alumni' });
    }
};

// @desc    Get Alumni By ID
// @route   GET /api/users/alumni/:id
// @access  Private
export const getAlumniById = async (req, res) => {
    try {
        const alumni = await User.findById(req.params.id).select('-password -resetOTP -resetOTPExpires -loginOTP -loginOTPExpires');
        if (!alumni || alumni.role !== 'alumni') return res.status(404).json({ message: 'Alumni not found' });
        res.status(200).json(alumni);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching alumni details' });
    }
};

// @desc    Update Availability Slots
// @route   PUT /api/users/availability
// @access  Private (Alumni Only)
export const updateAvailability = async (req, res) => {
    const { availabilitySlots } = req.body;
    try {
        if (req.user.role !== 'alumni') return res.status(403).json({ message: 'Not authorized as alumni' });

        // Validate that availabilitySlots is an array and cap its size
        if (!Array.isArray(availabilitySlots) || availabilitySlots.length > 100) {
            return res.status(400).json({ message: 'Invalid availability slots data.' });
        }

        const user = await User.findById(req.user._id);

        // Keep existing booked slots intact to prevent corruption, merge with newly submitted slots
        const existingBooked = user.availabilitySlots.filter(s => s.isBooked);
        const newunbooked = availabilitySlots.map(slot => ({ ...slot, isBooked: false }));

        user.availabilitySlots = [...existingBooked, ...newunbooked];
        await user.save();

        res.status(200).json(user.availabilitySlots);
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating availability' });
    }
};

// @desc    Get pre-aggregated Analytics for Dashboard
// @route   GET /api/users/analytics/dashboard
// @access  Private
export const getAnalytics = async (req, res) => {
    try {
        const cacheKey = `analytics:${req.user._id}`;
        const redisClient = getRedisClient();

        if (redisClient) {
            const cachedStats = await redisClient.get(cacheKey);
            if (cachedStats) {
                return res.status(200).json(JSON.parse(cachedStats));
            }
        }

        const { default: Analytics } = await import("../models/Analytics.js");
        const user = await User.findById(req.user._id).select('rating totalSessions profilePhoto headline name createdAt');
        let stats = await Analytics.findOne({ user: req.user._id }).lean();

        if (!stats) {
            stats = {
                connections: { sent: 0, pending: 0, accepted: 0, received: 0 },
                engagement: { postsCreated: 0, totalLikesReceived: 0, totalCommentsReceived: 0 },
                sessions: { totalAttended: 0, totalHours: 0 }
            };
        }

        // --- PHASE 1: Success Score Calculation (Dynamic) ---
        if (req.user.role === 'alumni') {
            // Calculate Scores (0-100)
            const qualityScore = (user.rating || 0) * 20; // 5 stars = 100%
            const volumeScore = Math.min((user.totalSessions || 0) * 5, 100); // 20 sessions = 100%
            const engagementScore = Math.min((stats.engagement.totalLikesReceived || 0) * 2 + (stats.engagement.totalCommentsReceived || 0) * 5, 100);
            
            // Aggregate Overall Success Score
            const successScore = Math.round((qualityScore * 0.5) + (volumeScore * 0.3) + (engagementScore * 0.2));
            
            stats.successMetrics = {
                overall: successScore,
                quality: qualityScore,
                volume: volumeScore,
                engagement: engagementScore,
                rating: user.rating || 0
            };
        }

        // --- PHASE 3: Student Demand & Trend Intelligence ---
        // We aggregate frequent keywords from recent session descriptions
        const recentSessions = await Session.find({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('description');

        const stopWords = new Set(['the', 'and', 'for', 'with', 'session', 'about', 'help', 'need', 'how', 'this', 'that', 'from', 'mentorship', 'please', 'would', 'will', 'your', 'guide']);
        const wordFreq = {};
        
        recentSessions.forEach(s => {
            const words = s.description.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);
            words.forEach(word => {
                if (word.length > 2 && !stopWords.has(word)) {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                }
            });
        });

        const trendingTopics = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ topic: word, demand: count }));

        stats.trends = trendingTopics;

        // --- PHASE 4: Professional Milestone Timeline ---
        const milestones = [];
        milestones.push({ 
            title: "Joined the Community", 
            date: user.createdAt || req.user.createdAt, 
            icon: "Rocket", 
            color: "text-blue-500", 
            description: "Started your mentorship journey at Talentronaut." 
        });

        if (user.totalSessions > 0 || stats.sessions.totalAttended > 0) {
            milestones.push({ 
                title: "Journey Started", 
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Mock or find first session date
                icon: "Zap", 
                color: "text-amber-500", 
                description: "Hosted your very first mentorship session." 
            });
        }

        if (user.totalSessions >= 10 || stats.sessions.totalAttended >= 10) {
            milestones.push({ 
                title: "Expert Mentor", 
                date: new Date(),
                icon: "Trophy", 
                color: "text-purple-500", 
                description: "Recognized as a senior guide with 10+ sessions." 
            });
        }

        if (user.rating >= 4.8) {
            milestones.push({ 
                title: "Top Contributor", 
                date: new Date(),
                icon: "Star", 
                color: "text-emerald-500", 
                description: "Maintaining a near-perfect rating from students." 
            });
        }

        stats.milestones = milestones.reverse(); // Newest first

        if (redisClient) {
            await redisClient.setEx(cacheKey, 600, JSON.stringify(stats)); 
        }

        res.status(200).json(stats);
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update Availability Status
// @route   PUT /api/users/status
// @access  Private
export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Available', 'Busy', 'Offline'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.availabilityStatus = status;
        await user.save();

        res.status(200).json({ availabilityStatus: user.availabilityStatus });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Server error updating status" });
    }
};

// @desc    Report a user
// @route   POST /api/users/report
// @access  Private
export const reportUser = async (req, res) => {
    try {
        const { reportedUserId, reason, description } = req.body;
        
        if (!reportedUserId || !reason || !description) {
            return res.status(400).json({ message: 'Missing report data' });
        }

        const report = await Report.create({
            reporter: req.user._id,
            reportedUser: reportedUserId,
            reason,
            description
        });

        res.status(201).json({ message: 'Report submitted successfully. Admin will review it shortly.', report });
    } catch (error) {
        console.error("Error reporting user:", error);
        res.status(500).json({ message: 'Error submitting report' });
    }
};
