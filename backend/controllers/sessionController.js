import Session from '../models/Session.js';
import User from '../models/User.js';

// @desc    Book a new session (Student booking an Alumni)
// @route   POST /api/sessions/book
// @access  Private
export const bookSession = async (req, res) => {
    const { hostId, title, description, agenda, date, startTime, endTime } = req.body;
    const studentId = req.user._id;

    try {
        // Validate host exists
        const host = await User.findById(hostId);
        if (!host || host.role !== 'alumni') {
            return res.status(404).json({ message: 'Alumni not found' });
        }

        // Verify slot is available
        const slotIndex = host.availabilitySlots.findIndex(slot => 
            new Date(slot.date).toDateString() === new Date(date).toDateString() &&
            slot.startTime === startTime && 
            slot.endTime === endTime
        );

        if (slotIndex === -1 || host.availabilitySlots[slotIndex].isBooked) {
            return res.status(400).json({ message: 'Time slot is no longer available.' });
        }

        // Generate mock Google Meet link
        const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 5)}`;

        // Create Session
        const session = await Session.create({
            host: hostId,
            student: studentId,
            title,
            description,
            agenda,
            date,
            startTime,
            endTime,
            meetLink,
            status: 'scheduled'
        });

        // Mark Slot as Booked
        host.availabilitySlots[slotIndex].isBooked = true;
        await host.save();

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's sessions (Both Student and Alumni views)
// @route   GET /api/sessions/my-sessions
// @access  Private
export const getMySessions = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;

        const query = role === 'alumni' 
            ? { host: userId } 
            : { $or: [{ student: userId }, { registeredStudents: userId }] };

        let sessions = await Session.find(query)
            .populate('host', 'name email profilePhoto branch company currentPosition')
            .populate('student', 'name email profilePhoto branch currentYear')
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
                    // Increment total sessions for host
                    await User.findByIdAndUpdate(session.host._id, { $inc: { totalSessions: 1 } });
                }
            }
            return session;
        }));

        res.json(updatedSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register for a global session (Webinar)
// @route   POST /api/sessions/:id/register
// @access  Private (Student/Alumni)
export const registerForGlobalSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session || !session.isGlobal) {
            return res.status(404).json({ message: 'Global session not found' });
        }

        // Only students and the assigned speaker (host) can register
        if (req.user.role !== 'student' && session.host.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only students and the assigned speaker can register for this event.' });
        }

        if (session.registeredStudents.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already registered' });
        }

        session.registeredStudents.push(req.user._id);
        await session.save();

        res.status(200).json({ message: 'Successfully registered for session', session });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all upcoming global events for discovery
// @route   GET /api/sessions/global
// @access  Private
export const getPublicGlobalSessions = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;

        let query = { isGlobal: true, status: 'scheduled' };

        // Visibility Rule: Students see all. Alumni see only where they are the host.
        if (role === 'alumni') {
            query.host = userId;
        }

        let sessions = await Session.find(query)
            .populate('host', 'name email profilePhoto company currentPosition branch')
            .sort({ date: 1, startTime: 1 });

        // Auto-complete passed events
        const now = new Date();
        const activeSessions = [];
        for (let session of sessions) {
            const [endHour, endMin] = session.endTime.split(':').map(Number);
            const sessionEnd = new Date(session.date);
            sessionEnd.setHours(endHour, endMin, 0, 0);

            if (sessionEnd < now) {
                session.status = 'completed';
                await session.save();
                await User.findByIdAndUpdate(session.host._id, { $inc: { totalSessions: 1 } });
            } else {
                activeSessions.push(session);
            }
        }

        res.status(200).json(activeSessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel a session
// @route   PUT /api/sessions/:id/cancel
// @access  Private
export const cancelSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Ensure user is involved
        if (session.host.toString() !== req.user._id.toString() && session.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        session.status = 'cancelled';
        await session.save();

        // Release the slot back to the host
        const host = await User.findById(session.host);
        if (host) {
            const slot = host.availabilitySlots.find(s => 
                new Date(s.date).toDateString() === new Date(session.date).toDateString() &&
                s.startTime === session.startTime &&
                s.endTime === session.endTime
            );
            if (slot) {
                slot.isBooked = false;
                await host.save();
            }
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Feedback (Rating & Review)
// @route   PUT /api/sessions/:id/feedback
// @access  Private (Student Only)
export const addFeedback = async (req, res) => {
    const { rating, review } = req.body;
    try {
        const session = await Session.findById(req.params.id);
        if (!session || session.student.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Session not found or not authorized' });
        }

        if (session.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate completed sessions' });
        }

        session.feedback = { rating, review };
        await session.save();

        // Update Host Average Rating
        const hostSessions = await Session.find({ host: session.host, 'feedback.rating': { $exists: true } });
        const avg = hostSessions.reduce((acc, curr) => acc + curr.feedback.rating, 0) / hostSessions.length;
        
        await User.findByIdAndUpdate(session.host, { rating: avg });

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark Session Completed
// @route   PUT /api/sessions/:id/complete
// @access  Private (Alumni Only)
export const completeSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session || session.host.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Session not found or not authorized' });
        }

        session.status = 'completed';
        await session.save();

        // Update Host totalSessions
        await User.findByIdAndUpdate(session.host, { $inc: { totalSessions: 1 } });

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
