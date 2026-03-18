import nodemailer, { type Transporter } from "nodemailer";

import type { ComplaintStatus } from "../models/Complaint";

type EmailPayload = {
  recipientEmail: string;
  subject: string;
  html: string;
};

const getEmailProvider = () => (process.env.NODE_ENV === "production" ? "resend" : "mailtrap");

let mailtrapTransporter: Transporter | null = null;

const getMailtrapTransporter = (): Transporter | null => {
  const { MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS } = process.env;

  if (!MAILTRAP_HOST || !MAILTRAP_PORT || !MAILTRAP_USER || !MAILTRAP_PASS) {
    console.warn(
      "Mailtrap SMTP email skipped because MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, or MAILTRAP_PASS is missing.",
    );
    return null;
  }

  if (!mailtrapTransporter) {
    mailtrapTransporter = nodemailer.createTransport({
      host: MAILTRAP_HOST,
      port: Number(MAILTRAP_PORT),
      secure: Number(MAILTRAP_PORT) === 465,
      auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS,
      },
    });
  }

  return mailtrapTransporter;
};

const sendWithMailtrapSmtp = async ({ recipientEmail, subject, html }: EmailPayload): Promise<void> => {
  const transporter = getMailtrapTransporter();
  const senderEmail = process.env.MAILTRAP_SENDER_EMAIL;

  if (!transporter || !senderEmail) {
    console.warn("Mailtrap SMTP email skipped because transporter setup or MAILTRAP_SENDER_EMAIL is missing.");
    return;
  }

  await transporter.sendMail({
    from: senderEmail,
    to: recipientEmail,
    subject,
    html,
  });
};

const sendWithResend = async ({ recipientEmail, subject, html }: EmailPayload): Promise<void> => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend email skipped because RESEND_API_KEY or RESEND_FROM_EMAIL is missing.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [recipientEmail],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Resend email failed with status ${response.status}: ${responseBody}`);
  }
};

const buildComplaintStatusEmail = ({
  complaintTitle,
  status,
  message,
}: {
  complaintTitle: string;
  status: ComplaintStatus;
  message: string;
}) => {
  return {
    subject: `Civic Connect | Complaint Status Update: ${status}`,
    html: `
      <div style="background:#f1f5f9;padding:30px 0;font-family:Arial,Helvetica,sans-serif;">
        <table align="center" width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background:#1e3a8a;color:white;padding:18px 24px;">
              <h2 style="margin:0;font-size:20px;">Civic Connect Portal</h2>
              <p style="margin:4px 0 0;font-size:13px;color:#cbd5f5;">
                Official Citizen Complaint Management System
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px;color:#0f172a;">
              <h3 style="margin-top:0;color:#1e293b;">
                Complaint Status Update
              </h3>

              <p style="font-size:14px;color:#334155;">
                Dear Citizen,
              </p>

              <p style="font-size:14px;color:#334155;">
                This is to inform you that the status of your complaint has been updated.
              </p>

              <!-- Complaint Box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:18px 0;">
                
                <p style="margin:0;font-size:14px;">
                  <strong>Complaint Title:</strong>
                </p>

                <p style="margin:6px 0 14px;font-size:14px;color:#475569;">
                  ${complaintTitle}
                </p>

                <p style="margin:0;font-size:14px;">
                  <strong>Current Status:</strong>
                </p>

                <p style="
                  display:inline-block;
                  margin-top:8px;
                  padding:6px 12px;
                  border-radius:4px;
                  font-size:13px;
                  font-weight:bold;
                  background:${
                    status === "Resolved"
                      ? "#dcfce7"
                      : status === "Rejected"
                      ? "#fee2e2"
                      : "#dbeafe"
                  };
                  color:${
                    status === "Resolved"
                      ? "#166534"
                      : status === "Rejected"
                      ? "#991b1b"
                      : "#1e40af"
                  };
                ">
                  ${status}
                </p>

                <p style="margin-top:16px;font-size:14px;color:#475569;">
                  ${message}
                </p>
              </div>

              <p style="font-size:14px;color:#334155;">
                You can log in to the Civic Connect portal to track your complaint progress and view additional updates.
              </p>

              <p style="margin-top:24px;font-size:14px;">
                Regards,<br/>
                <strong>Civic Connect Administration</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                This is an automated message from the Civic Connect system. Please do not reply to this email.
              </p>

              <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Civic Connect | Government Civic Complaint Platform
              </p>
            </td>
          </tr>

        </table>
      </div>
    `,
  };
};

export const sendComplaintStatusEmail = async ({
  recipientEmail,
  complaintTitle,
  status,
  message,
}: {
  recipientEmail: string;
  complaintTitle: string;
  status: ComplaintStatus;
  message: string;
}): Promise<void> => {
  if (!["In Progress", "Resolved", "Rejected"].includes(status)) {
    return;
  }

  const emailContent = buildComplaintStatusEmail({
    complaintTitle,
    status,
    message,
  });
  const provider = getEmailProvider();

  try {
    if (provider === "resend") {
      await sendWithResend({
        recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      return;
    }

    await sendWithMailtrapSmtp({
      recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (error) {
    console.error(`Failed to send complaint status email via ${provider}`, error);
  }
};
