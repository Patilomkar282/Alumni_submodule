import ConnectionRequest from '../models/ConnectionRequest.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

// @desc    Send a connection request
// @route   POST /api/connections/request
// @access  Private (Student only)
export const sendRequest = async (req, res) => {
    const { recipientId, message } = req.body;
    const requesterId = req.user._id;

    try {
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Student-to-Student connection check
        if (req.user.role === 'student' && recipient.role === 'student') {
            return res.status(400).json({ message: 'Students can only connect with Alumni mentors, not with other students.' });
        }

        // Check if request already exists
        const existingRequest = await ConnectionRequest.findOne({
            requester: requesterId,
            recipient: recipientId
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already sent' });
        }

        let request = await ConnectionRequest.create({
            requester: requesterId,
            recipient: recipientId,
            message
        });

        // Populate recipient to return consistent data structure
        request = await ConnectionRequest.findById(request._id).populate('recipient', 'name email profilePhoto currentYear branch company expertiseAreas');

        // Notify Recipient
        await createNotification({
            recipient: recipientId,
            sender: requesterId,
            type: 'connection_request',
            message: `New connection request from ${req.user.name}`,
            relatedId: request._id
        });

        res.status(201).json({ connection: request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get received requests
// @route   GET /api/connections/received
// @access  Private (Alumni only)
export const getReceivedRequests = async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({ recipient: req.user._id, status: 'pending' })
            .populate('requester', 'name email profilePhoto currentYear branch')
            .sort('-createdAt');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update request status (Accept/Reject)
// @route   PUT /api/connections/request/:id
// @access  Private (Alumni only)
export const updateRequestStatus = async (req, res) => {
    const { status } = req.body; // 'accepted' or 'rejected'

    try {
        const request = await ConnectionRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Ensure the logged-in user is the recipient
        if (request.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Notify Requester
            await createNotification({
                recipient: request.requester,
                sender: req.user._id,
                type: 'connection_accepted',
                message: `${req.user.name} accepted your connection request`,
                relatedId: request._id
            });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get requests sent by the user
// @route   GET /api/connections/sent
// @access  Private
export const getSentRequests = async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({ requester: req.user._id })
            .populate('recipient', 'name email profilePhoto currentYear branch company expertiseAreas')
            .sort('-createdAt');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all accepted connections
// @route   GET /api/connections
// @access  Private
export const getConnections = async (req, res) => {
    try {
        const connections = await ConnectionRequest.find({
            $or: [
                { requester: req.user._id, status: 'accepted' },
                { recipient: req.user._id, status: 'accepted' }
            ]
        })
            .populate('requester', 'name email profilePhoto currentYear branch company expertiseAreas availabilityStatus')
            .populate('recipient', 'name email profilePhoto currentYear branch company expertiseAreas availabilityStatus');

        // Format the response to return a list of connected users
        const connectedUsers = connections.map(conn => {
            if (conn.requester._id.toString() === req.user._id.toString()) {
                return conn.recipient;
            } else {
                return conn.requester;
            }
        });

        res.json(connectedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
