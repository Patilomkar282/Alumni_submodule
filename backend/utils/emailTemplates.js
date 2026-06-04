// ─── Email HTML Templates ────────────────────────────────────────────────────

const baseWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                MMCOE Connect
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Alumni &amp; Student Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; 2025 MMCOE Connect &bull; MMCOE, Karvenagar, Pune
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── 1. Welcome Email (on registration) ──────────────────────────────────────
export const welcomeEmailTemplate = (name, role) => {
    const roleLabel = role === 'alumni' ? 'Alumni' : 'Student';
    return {
        subject: 'Welcome to MMCOE Connect! 🎉',
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Welcome, ${name}!</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">You've successfully created your <strong>${roleLabel}</strong> account.</p>

            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#166534;font-size:14px;">
                    <strong>Account Created Successfully</strong><br>
                    Your journey at MMCOE Connect begins here.
                </p>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">
                To get started, please complete your profile so our admin team can review and verify your account.
                Once verified, you will have full access to all platform features.
            </p>

            <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;color:#92400e;font-size:14px;">
                    <strong>Next Step:</strong> Complete your profile to submit it for admin verification.
                </p>
            </div>

            <h3 style="color:#374151;font-size:15px;margin:0 0 12px;">What you can do on MMCOE Connect:</h3>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                ${role === 'alumni' ? `
                <tr><td style="padding:6px 0;color:#374151;font-size:14px;">🎓 &nbsp;Connect with current students as a mentor</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px;">📅 &nbsp;Schedule and host mentorship sessions</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px;">📢 &nbsp;Share your career journey and experiences</td></tr>
                ` : `
                <tr><td style="padding:6px 0;color:#374151;font-size:14px;">🤝 &nbsp;Connect with alumni mentors in your field</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px;">📅 &nbsp;Book 1:1 mentorship sessions</td></tr>
                <tr><td style="padding:6px 0;color:#374151;font-size:14px;">💼 &nbsp;Explore career opportunities and guidance</td></tr>
                `}
            </table>

            <p style="color:#6b7280;font-size:13px;margin:0;">
                If you have any questions, please reach out to the MMCOE administration.
            </p>
        `)
    };
};

// ─── 2. Profile Under Review Email (on profile completion) ───────────────────
export const profileUnderReviewTemplate = (name, role) => {
    const roleLabel = role === 'alumni' ? 'Alumni' : 'Student';
    return {
        subject: 'Your Profile is Under Review – MMCOE Connect',
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Profile Submitted, ${name}!</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">Your <strong>${roleLabel}</strong> profile has been submitted for review.</p>

            <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#1e40af;font-size:14px;">
                    <strong>Status: Under Review</strong><br>
                    Our admin team will verify your profile shortly.
                </p>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Thank you for completing your profile on <strong>MMCOE Connect</strong>.
                Your information has been submitted and is currently being reviewed by our administrators.
            </p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
                <h3 style="margin:0 0 14px;color:#374151;font-size:15px;">What happens next?</h3>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="padding:8px 0;color:#374151;font-size:14px;">
                            <span style="display:inline-block;width:24px;height:24px;background:#4f46e5;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:bold;margin-right:10px;">1</span>
                            Admin reviews your profile details
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#374151;font-size:14px;">
                            <span style="display:inline-block;width:24px;height:24px;background:#4f46e5;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:bold;margin-right:10px;">2</span>
                            You receive an approval or feedback email
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#374151;font-size:14px;">
                            <span style="display:inline-block;width:24px;height:24px;background:#4f46e5;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:bold;margin-right:10px;">3</span>
                            Once approved, you get full access to the platform
                        </td>
                    </tr>
                </table>
            </div>

            <p style="color:#6b7280;font-size:13px;margin:0;">
                This process usually takes 1–2 business days. We appreciate your patience.
            </p>
        `)
    };
};

// ─── 3. Verification Approved Email ──────────────────────────────────────────
export const verificationApprovedTemplate = (name, role) => {
    const roleLabel = role === 'alumni' ? 'Alumni' : 'Student';
    return {
        subject: '✅ Profile Verified – Welcome to MMCOE Connect!',
        html: baseWrapper(`
            <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;background:#f0fdf4;border:2px solid #22c55e;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">✅</div>
            </div>

            <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;text-align:center;">You're Verified, ${name}!</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;text-align:center;">Your <strong>${roleLabel}</strong> profile has been approved by MMCOE Connect.</p>

            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#166534;font-size:14px;">
                    <strong>Status: Verified ✓</strong><br>
                    You now have full access to all MMCOE Connect features.
                </p>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Congratulations! Your profile has been reviewed and verified by our admin team.
                You can now enjoy the full MMCOE Connect experience.
            </p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:28px;">
                <h3 style="margin:0 0 14px;color:#374151;font-size:15px;">You now have access to:</h3>
                <table cellpadding="0" cellspacing="0" width="100%">
                    ${role === 'alumni' ? `
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Accept mentorship requests from students</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Schedule and host sessions</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Post and share updates with the community</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Display a <strong>Verified Mentor Badge</strong> on your profile</td></tr>
                    ` : `
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Send connection requests to alumni mentors</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Book 1:1 mentorship sessions</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✓ &nbsp;Access the full community feed and events</td></tr>
                    `}
                </table>
            </div>

            <p style="color:#6b7280;font-size:13px;text-align:center;margin:0;">
                Log in now and start connecting with the MMCOE community!
            </p>
        `)
    };
};

// ─── 4. Verification Rejected Email ──────────────────────────────────────────
export const verificationRejectedTemplate = (name) => {
    return {
        subject: 'Profile Verification Update – MMCOE Connect',
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Hi ${name},</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">We have an update regarding your profile verification on MMCOE Connect.</p>

            <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#991b1b;font-size:14px;">
                    <strong>Status: Requires Attention</strong><br>
                    Your profile verification could not be completed at this time.
                </p>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
                After reviewing your profile, our admin team was unable to verify it with the information currently provided.
                This could be due to incomplete details or information that needs to be updated.
            </p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
                <h3 style="margin:0 0 12px;color:#374151;font-size:15px;">To get verified, please:</h3>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">• &nbsp;Ensure all profile fields are fully completed</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">• &nbsp;Provide accurate graduation year and branch details</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">• &nbsp;Add your current company and position (for alumni)</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">• &nbsp;Upload a clear profile photo</td></tr>
                </table>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">
                Once you've updated your profile, it will be automatically resubmitted for review.
            </p>

            <p style="color:#6b7280;font-size:13px;margin:0;">
                If you believe this was a mistake or need assistance, please contact the MMCOE administration directly.
            </p>
        `)
    };
};

// ─── 5. Bulk Invite Email ────────────────────────────────────────────────────
export const bulkInviteTemplate = (name, role) => {
    const roleLabel = role === 'alumni' ? 'Alumni' : 'Student';
    return {
        subject: 'Welcome to MMCOE Connect! 🚀 Your account is ready.',
        html: baseWrapper(`
            <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Hi ${name},</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">An official <strong>${roleLabel}</strong> account has been created for you on the new MMCOE Connect platform!</p>

            <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#1e40af;font-size:14px;">
                    <strong>Account Ready</strong><br>
                    You can log in securely using your email and a One-Time Password (OTP).
                </p>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
                MMCOE Connect is our official platform for students and alumni to connect, share opportunities, and host mentorship sessions.
            </p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
                <h3 style="margin:0 0 12px;color:#374151;font-size:15px;">How to Log In:</h3>
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">1. Go to the MMCOE Connect login page.</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">2. Click on "Login with OTP".</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">3. Enter your email address to receive a secure login code.</td></tr>
                    <tr><td style="padding:6px 0;color:#374151;font-size:14px;">4. Once logged in, please complete your profile!</td></tr>
                </table>
            </div>

            <p style="color:#6b7280;font-size:13px;margin:0;">
                If you have any questions, please contact the MMCOE administration.
            </p>
        `)
    };
};
