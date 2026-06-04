import nodemailer from 'nodemailer';

// Reuse the transporter across requests (don't recreate on every call)
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('EMAIL_USER or EMAIL_PASS environment variable is not set.');
    }

    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,           // SSL on port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Must be a Gmail App Password, NOT your account password
        },
        pool: true,             // Reuse connections
        maxConnections: 5,
        socketTimeout: 10000,   // 10s timeout — prevents hanging on Render cold starts
        greetingTimeout: 10000,
        connectionTimeout: 10000,
    });

    return transporter;
};

/**
 * Send an email via Gmail SMTP.
 * @param {Object} options
 * @param {string} options.email       - Recipient email address
 * @param {string} options.subject     - Email subject line
 * @param {string} [options.message]   - Plain-text fallback body
 * @param {string} [options.html]      - HTML body (takes priority in email clients)
 */
const sendEmail = async (options) => {
    const transport = getTransporter();

    const mailOptions = {
        from: `"MMCOE Connect" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        ...(options.message && { text: options.message }),
        ...(options.html && { html: options.html }),
    };

    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`[Email] Sent to ${options.email} | MessageId: ${info.messageId}`);
        return info;
    } catch (error) {
        // Reset the cached transporter so the next call retries a fresh connection
        transporter = null;
        console.error(`[Email] Failed to send to ${options.email}:`, error.message);
        throw error;
    }
};

export default sendEmail;
