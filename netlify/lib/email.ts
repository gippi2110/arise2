/** Sends the sign-in code through Resend. Returns false when no provider is configured. */
export async function sendCodeEmail(to: string, code: string, origin: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const from = process.env.RESEND_FROM || 'Shadow System <onboarding@resend.dev>'
  const html = `
  <div style="margin:0;padding:32px 16px;background:#050509;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#EAF5FF">
    <div style="max-width:480px;margin:0 auto;border:1px solid rgba(22,140,255,.45);border-radius:14px;padding:28px 24px;background:linear-gradient(180deg,#080D20,#050509);box-shadow:0 0 40px rgba(22,140,255,.18)">
      <p style="margin:0 0 6px;letter-spacing:.35em;font-size:11px;color:#168CFF">SYSTEM NOTIFICATION</p>
      <h1 style="margin:0 0 18px;font-size:22px;letter-spacing:.08em;color:#EAF5FF">PLAYER AUTHENTICATION</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#B9CCE6">A sign-in request was received for <strong style="color:#EAF5FF">${to}</strong>. Enter this access code to enter the System. It expires in 10 minutes.</p>
      <div style="text-align:center;margin:24px 0">
        <span style="display:inline-block;padding:14px 26px;font-size:34px;letter-spacing:.45em;font-weight:700;color:#EAF5FF;border:1px solid rgba(114,21,200,.7);border-radius:10px;background:rgba(114,21,200,.15);box-shadow:0 0 24px rgba(114,21,200,.35)">${code}</span>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#6E86A8">If you did not request this, ignore this message. Nobody can enter without the code.<br>${origin}</p>
      <p style="margin:18px 0 0;font-size:12px;letter-spacing:.3em;color:#FF7100">THE SYSTEM IS WATCHING.</p>
    </div>
  </div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `[SYSTEM] Your access code: ${code}`, html, text: `Your Shadow System access code is ${code}. It expires in 10 minutes.` }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Email provider rejected the message (${res.status}): ${detail.slice(0, 300)}`)
  }
  return true
}
