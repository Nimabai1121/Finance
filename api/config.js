module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');

  const config = {
    url: process.env.SUPABASE_URL || 'https://ahqjztafnwugdxvtbwyn.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocWp6dGFmbnd1Z2R4dnRid3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTU4MDMsImV4cCI6MjA5MjA3MTgwM30.Zngvmdt9UkV5bzO20MbsUOTaJFrktT6C1donw3ihXek'
  };
  config.enabled = process.env.MULTI_USER_ENABLED === 'true';
  res.end(`window.APP_CONFIG = ${JSON.stringify(config)};`);
};
