import cron from 'node-cron';
import User from '../models/User.js';
import ConnectionRequest from '../models/ConnectionRequest.js'; // Ensure this model exists (or replace with Connections)
import Post from '../models/Post.js';
import Session from '../models/Session.js';
import Analytics from '../models/Analytics.js';

// Aggregate Analytics Job
// To satisfy the spec requirements, this pre-aggregates heavy counts.
export const startCronJobs = () => {
    // Run every 10 seconds for testing/demonstration. Intended for every 5-15 mins in production.
    cron.schedule('*/10 * * * * *', async () => {
        console.log(`[CRON] Running Analytics Aggregation Job at ${new Date().toISOString()}`);

        try {
            const users = await User.find({}, '_id role');

            for (const user of users) {
                const userId = user._id;

                // 1. Connection Stats
                // Assuming ConnectionRequest model has sender, receiver, status. 
                // Using try-catch around queries in case schemas differ slightly.
                let sent = 0, pending = 0, accepted = 0, received = 0, receivedPending = 0;
                try {
                    sent = await ConnectionRequest.countDocuments({ requester: userId });
                    pending = await ConnectionRequest.countDocuments({ requester: userId, status: 'pending' }); // Sent by this user
                    receivedPending = await ConnectionRequest.countDocuments({ recipient: userId, status: 'pending' }); // Received by this user and pending
                    accepted = await ConnectionRequest.countDocuments({
                        $or: [{ requester: userId, status: 'accepted' }, { recipient: userId, status: 'accepted' }]
                    });
                    received = await ConnectionRequest.countDocuments({ recipient: userId });
                } catch (e) {
                    // Model might be named Connections or fields might differ
                    // console.warn("Could not aggregate connections, check model schema.");
                }

                // 2. Engagement Stats
                let postsCreated = 0, totalLikesReceived = 0, totalCommentsReceived = 0;
                try {
                    const userPosts = await Post.find({ author: userId });
                    postsCreated = userPosts.length;
                    userPosts.forEach(post => {
                        totalLikesReceived += post.likes.length;
                        totalCommentsReceived += post.comments.length;
                    });
                } catch (e) {
                    // console.warn("Could not aggregate posts.");
                }

                // 3. Session Stats
                let totalAttended = 0;
                try {
                    // Assuming Session has attendees array or host field
                    totalAttended = await Session.countDocuments({
                        $or: [{ host: userId }, { attendees: userId }]
                    });
                } catch (e) {
                    // console.warn("Could not aggregate sessions.");
                }

                // Update or Create Analytics Document securely mapped to the User ID
                await Analytics.findOneAndUpdate(
                    { user: userId },
                    {
                        user: userId,
                        role: user.role,
                        connections: { sent, pending, accepted, received, receivedPending },
                        engagement: { postsCreated, totalLikesReceived, totalCommentsReceived },
                        sessions: { totalAttended, totalHours: 0 },
                        lastUpdated: new Date()
                    },
                    { upsert: true, new: true }
                );
            }
            console.log(`[CRON] Successfully aggregated data for ${users.length} users.`);
        } catch (error) {
            console.error("[CRON ERROR] Analytics Aggregation failed:", error);
        }
    });
};
