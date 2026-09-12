import "server-only";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export async function sendResendEmail(input: SendEmailInput): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) {
    return { sent: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        text: input.text,
        reply_to: input.replyTo,
        headers: input.headers,
      }),
    });
    if (!response.ok) {
      console.error("resend_failed", response.status);
      return { sent: false };
    }
    return { sent: true };
  } catch {
    console.error("resend_failed");
    return { sent: false };
  }
}
