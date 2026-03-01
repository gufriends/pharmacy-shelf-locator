import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "rivpharma <noreply@gufriends.me>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Email send failed: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
}

// ============================================
// Email Templates
// ============================================

export function verificationEmailTemplate(url: string) {
  return {
    subject: "Verifikasi Email — rivpharma",
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">rivpharma</h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Pharmacy Shelf Management</p>
        </div>
        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 8px;">Verifikasi Email Anda</h2>
          <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.5;">
            Klik tombol di bawah untuk memverifikasi alamat email Anda dan mengaktifkan akun.
          </p>
          <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #059669); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Verifikasi Email
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
          Jika Anda tidak mendaftar di rivpharma, abaikan email ini.
        </p>
      </div>
    `,
  };
}

export function resetPasswordEmailTemplate(url: string) {
  return {
    subject: "Reset Password — rivpharma",
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">rivpharma</h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Pharmacy Shelf Management</p>
        </div>
        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 8px;">Reset Password</h2>
          <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.5;">
            Klik tombol di bawah untuk mengatur ulang password Anda. Link ini berlaku selama 1 jam.
          </p>
          <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #059669); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
          Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
      </div>
    `,
  };
}

export function invitationEmailTemplate({
  inviterName,
  inviterEmail,
  organizationName,
  inviteLink,
}: {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteLink: string;
}) {
  return {
    subject: `Undangan bergabung ke ${organizationName} — rivpharma`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">rivpharma</h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Pharmacy Shelf Management</p>
        </div>
        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 8px;">Anda Diundang!</h2>
          <p style="font-size: 14px; color: #475569; margin: 0 0 8px; line-height: 1.5;">
            <strong>${inviterName}</strong> (${inviterEmail}) mengundang Anda untuk bergabung ke:
          </p>
          <p style="font-size: 20px; font-weight: 700; color: #0d9488; margin: 0 0 24px;">
            ${organizationName}
          </p>
          <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #059669); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Terima Undangan
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
          Jika Anda tidak mengenal pengirim, abaikan email ini.
        </p>
      </div>
    `,
  };
}
