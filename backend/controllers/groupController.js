import Group from '../models/Group.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
    try {
        const { name, description, members } = req.body;

        const group = await Group.create({
            name,
            description,
            admin: req.user._id,
            members: [req.user._id], // Admin is automatically a member
            pendingMembers: members || [] // Initial invites
        });

        // Send notifications to invited members
        if (members && members.length > 0) {
            for (const memberId of members) {
                await Notification.create({
                    recipient: memberId,
                    sender: req.user._id,
                    type: 'group_invite',
                    message: `${req.user.name} invited you to join the group "${name}"`,
                    relatedGroup: group._id
                });
            }
        }

        const fullGroup = await Group.findById(group._id)
            .populate("members", "-password")
            .populate("admin", "-password");

        res.status(201).json(fullGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
export const getMyGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            members: { $elemMatch: { $eq: req.user._id } }
        })
            .populate("members", "-password")
            .populate("admin", "-password")
            .sort({ updatedAt: -1 });

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Invite users to group
// @route   POST /api/groups/:id/invite
// @access  Private
export const inviteToGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { members } = req.body;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only admin can invite members" });
        }

        // Filter out already members or already pending
        const newInvites = members.filter(id =>
            !group.members.includes(id) && !group.pendingMembers.includes(id)
        );

        if (newInvites.length > 0) {
            group.pendingMembers.push(...newInvites);
            await group.save();

            // Send notifications
            for (const memberId of newInvites) {
                await Notification.create({
                    recipient: memberId,
                    sender: req.user._id,
                    type: 'group_invite',
                    message: `${req.user.name} invited you to join the group "${group.name}"`,
                    relatedGroup: group._id
                });
            }
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept group invite
// @route   PUT /api/groups/:id/join
// @access  Private
export const acceptInvite = async (req, res) => {
    try {
        const { id } = req.params; // Corrected to use ID from params directly if route is /:id/join
        // Actually route is defined as /:id/join in routes file, so req.params.id is the group id.

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.pendingMembers.includes(req.user._id)) {
            return res.status(400).json({ message: "No pending invite for this group" });
        }

        // Add to members, remove from pending
        group.members.push(req.user._id);
        group.pendingMembers = group.pendingMembers.filter(mid => mid.toString() !== req.user._id.toString());

        await group.save();

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Decline group invite
// @route   PUT /api/groups/:id/decline
// @access  Private
export const declineInvite = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.pendingMembers.includes(req.user._id)) {
            return res.status(400).json({ message: "No pending invite for this group" });
        }

        // Remove from pending
        group.pendingMembers = group.pendingMembers.filter(mid => mid.toString() !== req.user._id.toString());

        await group.save();

        res.json({ message: "Invite declined" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get group messages
// @route   GET /api/groups/:id/messages
// @access  Private
export const getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        // Check if user is member of group
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: "Not a member of this group" });
        }

        const skip = (page - 1) * limit;

        const messages = await Message.find({ group: id })
            .populate("sender", "name email profilePhoto")
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
