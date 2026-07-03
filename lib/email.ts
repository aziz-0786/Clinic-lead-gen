import nodemailer from 'nodemailer';

// Swappable email transport — console in dev, real SMTP in prod
function getTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Dev: log to console instead of sending
  return nodemailer.createTransport({ jsonTransport: true });
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; messageId?: string }> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? 'noreply@clinicleads.app';
  try {
    const info = await transport.sendMail({ from, ...payload });
    if (!process.env.SMTP_HOST) {
      console.log('[EMAIL DEV]', JSON.stringify({ from, ...payload }, null, 2));
    }
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
    return { ok: false };
  }
}

export function buildHighIntentEmailHtml(opts: {
  clinicName: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  concernType: string;
  urgency: string;
  intentLabel: string;
  intentScore: number;
  leadUrl: string;
}): string {
  const urgencyMap: Record<string, string> = {
    EMERGENCY_TODAY: '🚨 Emergency — needs help today',
    THIS_WEEK: '⚡ This week',
    THIS_MONTH: '📅 This month',
    JUST_EXPLORING: '🔍 Just exploring',
  };

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
      <h2 style="color:#0891b2;margin:0 0 16px;">New ${opts.intentLabel === 'HIGH' ? '🔴 High-Intent' : '🟡 Medium-Intent'} Patient Inquiry</h2>
      <p style="color:#6b7280;margin:0 0 24px;">A patient inquiry was received at <strong>${opts.clinicName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6b7280;width:40%;">Patient</td><td style="padding:8px 0;font-weight:600;">${opts.patientName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Phone</td><td style="padding:8px 0;font-weight:600;">${opts.patientPhone}</td></tr>
        ${opts.patientEmail ? `<tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;">${opts.patientEmail}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:#6b7280;">Concern</td><td style="padding:8px 0;">${opts.concernType}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Urgency</td><td style="padding:8px 0;">${urgencyMap[opts.urgency] ?? opts.urgency}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Intent Score</td><td style="padding:8px 0;"><strong>${opts.intentScore}/100 — ${opts.intentLabel}</strong></td></tr>
      </table>
      <a href="${opts.leadUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#0891b2;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">View in Dashboard →</a>
    </div>
  `;
}
