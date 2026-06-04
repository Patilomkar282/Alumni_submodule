import { createClient } from 'redis';

let redisClient = null;

export const initRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URI || 'redis://127.0.0.1:6379',
            socket: {
                connectTimeout: 500, // Very short timeout for local dev
                reconnectStrategy: false // Do not endlessly retry if Redis isn't running
            },
            disableOfflineQueue: true // Don't hang API requests if not connected
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
            redisClient = null; // Kill cache if it errors out
        });

        await redisClient.connect();
        console.log('Redis connected successfully');
    } catch (error) {
        console.error('Redis connection failed. Running without cache.', error.message);
        redisClient = null; // graceful degradation
    }
};

export const getRedisClient = () => {
    // Only return the client if it's actually connected to avoid hanging
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    return null;
};
