/**
 * WhatsApp alert interface — mock/console by default.
 * Swap the implementation below for WhatsApp Business API
 * once credentials are approved, without changing callers.
 */

export interface WhatsAppPayload {
  to: string;
  message: string;
}

export async function sendWhatsAppAlert(payload: WhatsAppPayload): Promise<{ ok: boolean }> {
  // DEV: log to console — replace this block with your WhatsApp Business API call
  console.log('[WHATSAPP MOCK]', JSON.stringify(payload, null, 2));
  return { ok: true };
}

export function buildHighIntentWhatsAppMessage(opts: {
  clinicName: string;
  patientName: string;
  patientPhone: string;
  concernType: string;
  urgency: string;
  intentLabel: string;
}): string {
  const urgencyLabel: Record<string, string> = {
    EMERGENCY_TODAY: 'Emergency (needs help today)',
    THIS_WEEK: 'This week',
    THIS_MONTH: 'This month',
    JUST_EXPLORING: 'Just exploring',
  };
  return [
    `🏥 *New ${opts.intentLabel} Intent Inquiry — ${opts.clinicName}*`,
    '',
    `👤 *Patient:* ${opts.patientName}`,
    `📞 *Phone:* ${opts.patientPhone}`,
    `🩺 *Concern:* ${opts.concernType}`,
    `⏰ *Urgency:* ${urgencyLabel[opts.urgency] ?? opts.urgency}`,
    '',
    'Please contact the patient promptly.',
  ].join('\n');
}
