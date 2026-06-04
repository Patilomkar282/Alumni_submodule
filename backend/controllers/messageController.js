import Message from '../models/Message.js';
import { createNotification } from './notificationController.js';
import { io } from '../server.js';

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Mark fetched messages as delivered if they were sent
        // Wait, actually, let's mark the ones sent TO ME as "read" here? Or in a separate endpoint?
        // Let's rely on a separate endpoint for read receipts to be explicit, but pulling them makes them "delivered".
        await Message.updateMany(
            { sender: userId, recipient: myId, status: 'sent' },
            { status: 'delivered' }
        );

        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: userId },
                { sender: userId, recipient: myId }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

        // Reverse to maintain chronological order for the UI
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { recipientId, groupId, content, type, callDuration, callStatus, fileUrl, fileName } = req.body;
        const senderId = req.user._id;

        if (groupId) {
            const message = await Message.create({
                sender: senderId,
                group: groupId,
                content: content || '',
                type: type || 'text',
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                callDuration: callDuration || 0,
                callStatus: callStatus || null
            });

            const fullMessage = await Message.findById(message._id)
                .populate("sender", "name email profilePhoto")
                .populate("group");

            // ─── Real-time: Emit to group members ────────────────────────────────────
            if (io) {
                io.to(groupId).emit("receive_message", fullMessage);
            }

            return res.status(201).json(fullMessage);
        }

        const message = await Message.create({
            sender: senderId,
            recipient: recipientId,
            content: content || '',
            type: type || 'text',
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            callDuration: callDuration || 0,
            callStatus: callStatus || null
        });

        // Populate sender details for real-time delivery
        const fullMessage = await Message.findById(message._id).populate("sender", "name email profilePhoto");

        // Notify Recipient
        await createNotification({
            recipient: recipientId,
            sender: senderId,
            type: 'new_message',
            message: `New message from ${req.user.name}`,
            relatedId: message._id
        });

        // ─── Real-time: Emit to recipient immediately ────────────────────────────────
        // Emit to the recipient's Socket.io room (joined via user._id)
        if (io && recipientId) {
            io.to(recipientId).emit("receive_message", fullMessage);
            // Also emit delivery confirmation to sender
            io.to(senderId).emit("message_delivered", { ...fullMessage.toObject(), status: 'delivered' });
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error('[Message Error]', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark messages from a user as read
// @route   PUT /api/messages/:userId/read
// @access  Private
export const markMessagesAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        await Message.updateMany(
            { sender: userId, recipient: myId, read: false },
            { read: true, status: 'read' }
        );

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Emoji Reaction on a message
// @route   PUT /api/messages/:messageId/react
// @access  Private
export const toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.user.toString() === userId.toString()
        );

        if (existingReactionIndex !== -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // If same emoji sent again, remove it (toggle off)
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Switch emoji
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ user: userId, emoji });
        }

        await message.save();
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
