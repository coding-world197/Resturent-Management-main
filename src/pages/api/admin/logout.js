// src/pages/api/admin/logout.js
// Logout endpoint – clears the HttpOnly admin JWT cookie.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Invalidate the cookie by setting an empty value and immediate expiry.
  // Adjust attributes to match the cookie set on login (HttpOnly, SameSite=Strict, Secure in production).
  const cookieOptions = [
    'admin_jwt=;',
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    'SameSite=Strict',
    // 'Secure' should be added in production over HTTPS; omitted for local dev.
  ].join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
  return res.status(200).json({ success: true });
}
