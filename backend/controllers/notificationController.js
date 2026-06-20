import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePhoto');

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update notification action status (Accept/Reject for requests/invites)
// @route   PUT /api/notifications/:id/action
// @access  Private
export const updateNotificationAction = async (req, res) => {
    try {
        const { actionStatus } = req.body; // 'accepted' or 'rejected'
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Only actionable notification types can have action status
        if (notification.type !== 'connection_request' && notification.type !== 'group_invite') {
            return res.status(400).json({ message: 'This notification type does not support actions' });
        }

        notification.actionStatus = actionStatus;
        notification.read = true; // Mark as read when action is taken
        await notification.save();

        console.log(`[Notification] User ${req.user._id} ${actionStatus} notification ${notification._id}`);
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to create notification
export const createNotification = async ({ recipient, sender, type, message, relatedId, relatedGroup }) => {
    try {
        await Notification.create({
            recipient,
            sender,
            type,
            message,
            relatedId,
            relatedGroup,
            actionStatus: (type === 'connection_request' || type === 'group_invite') ? 'pending' : 'accepted'
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
