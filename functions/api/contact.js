/**
 * POST /api/contact — formulario de contacto del portafolio.
 *
 * Variables en Cloudflare Pages (Settings → Variables and Secrets, como *secret*):
 *   TURNSTILE_SECRET_KEY  clave secreta del widget Turnstile
 *   RESEND_API_KEY        clave de Resend (el dominio rossmel.com debe estar verificado en Resend)
 *   TELEGRAM_BOT_TOKEN    (opcional) token del bot que avisa de cada mensaje
 *   TELEGRAM_CHAT_ID      (opcional) chat al que el bot manda el aviso
 *   CONTACT_TO            (opcional) correo destino; por defecto abastorossmel@gmail.com
 *   CONTACT_FROM          (opcional) remitente; por defecto "Portafolio <contacto@rossmel.com>"
 *
 * El mensaje sale por correo y, si está configurado, por Telegram. Basta con que llegue por uno.
 * Responde JSON { ok: true } o { ok: false, error: 'codigo' } con el status adecuado.
 */

const MAX = { name: 100, email: 200, phone: 40, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{6,40}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Número en formato internacional. `country` viene del selector del formulario ("BO+591"); si la
 * persona ya escribió el número con +, se respeta tal cual. Devuelve null si no es un número válido.
 */
function internationalPhone(phone, country) {
  if (!PHONE_RE.test(phone)) return null;
  const dial = /^[A-Z]{2}\+(\d{1,4})$/.exec(country)?.[1] ?? '591';
  const typedIntl = phone.startsWith('+');
  const digits = typedIntl ? phone.replace(/\D/g, '') : dial + phone.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return { shown: typedIntl ? phone : `+${dial} ${phone}`, wa: `https://wa.me/${digits}` };
}

async function sendEmail(env, m) {
  if (!env.RESEND_API_KEY) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Portafolio <contacto@rossmel.com>',
      to: [env.CONTACT_TO || 'abastorossmel@gmail.com'],
      reply_to: m.email,
      subject: m.context ? `Blog: comentario de ${m.name} sobre "${m.context}"` : `Portafolio: mensaje de ${m.name}`,
      text: `Nombre: ${m.name}\nCorreo: ${m.email}${m.phone ? `\nWhatsApp/teléfono: ${m.phone.shown} (${m.phone.wa})` : ''}\nIdioma del sitio: ${m.lang}${m.context ? `\nArtículo: ${m.context}` : ''}\n\n${m.message}`,
      html: `<p><b>Nombre:</b> ${escapeHtml(m.name)}<br><b>Correo:</b> ${escapeHtml(m.email)}${m.phone ? `<br><b>WhatsApp/teléfono:</b> <a href="${m.phone.wa}">${escapeHtml(m.phone.shown)}</a>` : ''}<br><b>Idioma del sitio:</b> ${m.lang}${m.context ? `<br><b>Artículo:</b> ${escapeHtml(m.context)}` : ''}</p><p style="white-space:pre-wrap">${escapeHtml(m.message)}</p>`,
    }),
  }).catch(() => null);
  return Boolean(res && res.ok);
}

async function sendTelegram(env, m) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const lines = [
    `<b>📬 ${m.context ? `Comentario del blog: ${escapeHtml(m.context)}` : 'Mensaje del portafolio'}</b>`,
    `<b>Nombre:</b> ${escapeHtml(m.name)}`,
    `<b>Correo:</b> ${escapeHtml(m.email)}`,
    ...(m.phone ? [`<b>WhatsApp:</b> <a href="${m.phone.wa}">${escapeHtml(m.phone.shown)}</a>`] : []),
    `<b>Idioma:</b> ${m.lang}`,
    '',
    // Telegram corta en 4096 caracteres
    escapeHtml(m.message.length > 3500 ? `${m.message.slice(0, 3500)}…` : m.message),
  ];
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
  }).catch(() => null);
  return Boolean(res && res.ok);
}

export async function onRequestPost({ request, env }) {
  const hasChannel = env.RESEND_API_KEY || (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  if (!env.TURNSTILE_SECRET_KEY || !hasChannel) return json({ ok: false, error: 'not_configured' }, 503);

  let data;
  try {
    data = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Honeypot: los humanos no ven este campo; si viene lleno, fingimos éxito.
  if (String(data.get('company') ?? '').trim()) return json({ ok: true });

  const m = {
    name: String(data.get('name') ?? '').replace(/\s+/g, ' ').trim(),
    email: String(data.get('email') ?? '').trim(),
    phone: String(data.get('phone') ?? '').replace(/\s+/g, ' ').trim(),
    country: String(data.get('phone_country') ?? ''),
    message: String(data.get('message') ?? '').trim(),
    lang: data.get('lang') === 'en' ? 'en' : 'es',
    // Artículo del blog desde el que se escribe (opcional)
    context: String(data.get('context') ?? '').replace(/\s+/g, ' ').trim().slice(0, 200),
  };
  const typedPhone = m.phone;
  m.phone = typedPhone ? internationalPhone(typedPhone, m.country) : null;
  const phoneOk = !typedPhone || m.phone !== null;
  if (!m.name || !m.message || !EMAIL_RE.test(m.email) || !phoneOk || m.name.length > MAX.name || m.email.length > MAX.email || typedPhone.length > MAX.phone || m.message.length > MAX.message) {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  // Turnstile (antispam de Cloudflare)
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: String(data.get('cf-turnstile-response') ?? ''),
      remoteip: request.headers.get('CF-Connecting-IP') ?? '',
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!verify.success) return json({ ok: false, error: 'captcha' }, 400);

  const [mailed, notified] = await Promise.all([sendEmail(env, m), sendTelegram(env, m)]);
  if (!mailed && !notified) return json({ ok: false, error: 'send_failed' }, 502);

  return json({ ok: true });
}
