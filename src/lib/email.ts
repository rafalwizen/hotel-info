/**
 * Transactional email via Resend HTTP API (no SDK). In development without
 * RESEND_API_KEY the message is logged instead of sent.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[dev:email] to=${opts.to} subject="${opts.subject}"`);
    console.log(opts.html);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Hotel Info <onboarding@resend.dev>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    console.error(`[email] Resend API error ${res.status}: ${await res.text()}`);
  }
}

export function passwordResetEmailHtml(link: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0f766e">Reset hasła — Hotel Info</h2>
      <p>Otrzymujemy prośbę o reset hasła do Twojego konta Hotel Info.</p>
      <p>
        <a href="${link}"
           style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
          Ustaw nowe hasło
        </a>
      </p>
      <p style="color:#666;font-size:13px">
        Link wygasa za 60 minut. Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość.
      </p>
    </div>
  `;
}
