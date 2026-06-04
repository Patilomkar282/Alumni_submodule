import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token (algorithm locked to HS256 to prevent alg:none attacks)
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

            if (decoded.role === 'admin') {
                // Central Admin Bypass:
                // Since the token is cryptographically verified to be from the Central System,
                // we can dynamically inject an admin object without requiring them to exist in the local DB.
                req.user = {
                    _id: decoded.id,
                    name: 'Super Admin',
                    email: decoded.email,
                    role: 'admin',
                    isAdmin: true
                };
                return next();
            }

            // Get user from the token — always re-fetch so suspension/deletion is respected
            req.user = await User.findById(decoded.id).select('-password -resetOTP -loginOTP');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, account not found' });
            }

            // Block suspended users even if their token is still valid
            if (req.user.isSuspended) {
                return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
            }

            next();
        } catch (error) {
            // Do NOT expose internal error details to client
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
