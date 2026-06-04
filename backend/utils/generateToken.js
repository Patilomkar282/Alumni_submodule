import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    // SECURITY: Never log the JWT secret or the produced token.
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Short-lived. Implement refresh tokens for longer UX sessions.
        algorithm: 'HS256',
    });
};

export default generateToken;
