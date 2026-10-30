const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.APP_URL;
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !appUrl) {
    return json(res, 503, { error: 'User invitations are not configured on the server.' });
  }

  const origin = req.headers.origin;
  if (origin && origin !== new URL(appUrl).origin) {
    return json(res, 403, { error: 'Request origin is not allowed.' });
  }

  const token = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(res, 401, { error: 'Sign in as an administrator to invite users.' });

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
    });
    if (!userResponse.ok) return json(res, 401, { error: 'Your session is invalid or has expired.' });
    const user = await userResponse.json();

    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
    );
    if (!profileResponse.ok) {
      console.error('Unable to verify administrator role:', profileResponse.status);
      return json(res, 503, { error: 'Could not verify administrator access.' });
    }
    const profiles = await profileResponse.json();
    if (profiles[0]?.role !== 'admin') {
      return json(res, 403, { error: 'Administrator access is required to invite users.' });
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { error: 'Enter a valid email address.' });
    }

    const inviteUrl = new URL('/auth/v1/invite', supabaseUrl);
    inviteUrl.searchParams.set('redirect_to', appUrl);
    const inviteResponse = await fetch(inviteUrl, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    if (!inviteResponse.ok) {
      const error = await inviteResponse.json().catch(() => ({}));
      const message = error.msg || error.message || 'The invitation could not be sent.';
      return json(res, inviteResponse.status, { error: message });
    }

    return json(res, 200, { message: `Invitation sent to ${email}.` });
  } catch (error) {
    console.error('User invitation failed:', error);
    return json(res, 500, { error: 'The invitation could not be processed. Check the server logs.' });
  }
};
