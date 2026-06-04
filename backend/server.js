import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { globalLimiter } from './middleware/rateLimiter.js';
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import connectionRoutes from './routes/connectionRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import postRoutes from './routes/postRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import savedPostRoutes from './routes/savedPostRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import { startCronJobs } from './utils/cronJobs.js';

dotenv.config();

// Connect to Database
connectDB();

// Start Background Aggregation Tasks
startCronJobs();

import { initRedis } from "./config/redisClient.js";
initRedis();

const app = express();
const httpServer = createServer(app);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet());

// ─── HTTP Request Logging (Morgan) ────────────────────────────────────────────
// Use 'combined' in production, 'dev' locally. Never log request bodies.
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
// FRONTEND_URL supports a single URL or comma-separated list.
// e.g. FRONTEND_URL=https://alumni-connection-module.vercel.app
const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    ...envOrigins,
].filter(Boolean);

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        return callback(new Error(`CORS: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS to all routes — handles preflight OPTIONS automatically
app.use(cors(corsOptions));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
// Auth-specific limiter lives in middleware/rateLimiter.js and is applied in authRoutes.js
app.use(globalLimiter);

// ─── Body Parser ─────────────────────────────────────────────────────────────
// Kept at a safe limit. Profile photos should be uploaded to Cloudinary directly.
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/saved-posts', savedPostRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/stories', storyRoutes);

// Socket.io Setup
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS: Origin ${origin} not allowed`));
        },
        methods: ["GET", "POST"],
        credentials: true,
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("join_room", (userId) => {
        socket.join(userId);
        console.log(`User joined room: ${userId}`);
    });

    socket.on("join_group", (groupId) => {
        socket.join(groupId);
        console.log(`User joined group: ${groupId}`);
    });

    socket.on("send_message", (data) => {
        // data: { senderId, recipientId, groupId, content, ... }
        if (data.groupId) {
            io.to(data.groupId).emit("receive_message", data);
        } else {
            // Emit to recipient's room
            io.to(data.recipientId).emit("receive_message", data);
            // Confirm delivery to sender
            io.to(data.senderId).emit("message_delivered", data);
        }
    });

    // --- Premium Messaging UX ---
    socket.on("typing", (data) => {
        io.to(data.recipientId).emit("participant_typing", data);
    });

    socket.on("stop_typing", (data) => {
        io.to(data.recipientId).emit("participant_stop_typing", data);
    });

    socket.on("mark_messages_read", (data) => {
        // data should have { senderId, recipientId } where recipientId is the person marking them read
        io.to(data.senderId).emit("messages_seen", data);
    });

    socket.on("message_reacted", (data) => {
        io.to(data.recipientId).emit("update_message_reaction", data);
    });

    socket.on("update_status", (data) => {
        // Broadcast availability update to everyone else
        socket.broadcast.emit("status_updated", data);
    });

    socket.on("endCall", (data) => {
        io.to(data.to).emit("endCall");
    });

    // --- Mesh Networking for Group Calls ---

    // 1. User wants to join a group video call room
    socket.on("join_group_call", (roomId) => {
        socket.join(roomId);
        // Tell everyone ELSE in the room that a new user joined, returning socket.id to uniquely identify peer
        socket.to(roomId).emit("user_joined_group_call", { signalSocketId: socket.id, userSocketId: socket.id });
    });

    // 2. Existing user sends an Offer signal to the NEW user
    socket.on("send_group_signal", (payload) => {
        io.to(payload.userToSignal).emit("receive_group_signal", {
            signal: payload.signal,
            callerID: payload.callerID
        });
    });

    // 3. New user receives Offer, creates Answer, and sends it back
    socket.on("return_group_signal", (payload) => {
        io.to(payload.callerID).emit("receive_returned_signal", {
            signal: payload.signal,
            id: socket.id
        });
    });

    // 4. User leaves the group call
    socket.on("leave_group_call", (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit("user_left_group_call", socket.id);
    });

});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export io instance so controllers can access it for real-time events
export { io };
