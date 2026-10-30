# Finance Manager

A personal finance tracker with private, cloud-synced accounts, monthly budgets, expenses, savings, and an administrator invitation panel.

## Set up Supabase

1. In the Supabase SQL Editor, run [`supabase/migrations/20261030000000_multi_user_finance.sql`](./supabase/migrations/20261030000000_multi_user_finance.sql).
2. In Supabase Authentication settings, disable public sign-ups. Set the Site URL to the deployed app URL and allow that URL as a redirect destination.
3. Configure email delivery in Supabase Auth. Invitations and password resets require working SMTP.
4. Create the first account using Supabase Authentication → Users → Invite user. After accepting the invitation, promote that account in the SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('admin@example.com');
   ```

   Replace the example email with the first administrator's email. The profile trigger must be installed before creating this first user.

## Configure Vercel

Add these environment variables to the Vercel project. Keep the service-role key server-side; never add it to HTML or expose it to the browser.

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` secret key |
| `APP_URL` | Exact deployed app URL, including `https://` and no trailing slash |
| `MULTI_USER_ENABLED` | Set to `true` only after the database, first admin, and email delivery are ready |

Until `MULTI_USER_ENABLED` is set to `true`, the app stays in its existing local-only mode. This lets you deploy the code without interrupting the current app, then enable accounts after setup. Redeploy after setting the variables. The browser only receives the project URL and public anon key. Account invitations run through the protected `/api/invite-user` Vercel function, which verifies the caller's session and admin role before using the service-role key.

## First sign-in and existing data

The first administrator who signs in on the same browser origin that contains the old Finance Manager data will have that browser's saved data moved to their private cloud account. The old local copy is removed after the cloud save succeeds to prevent it being imported into another user's account. Other invited users start with empty data.

Browser storage is isolated by website address. If the old data is on a different origin (for example, `localhost` instead of the deployed Vercel URL), open the old address in the same browser and download a backup from Settings. Sign in at the deployed app and restore that JSON from Settings.

Finance data is stored in Supabase under the signed-in user's ID and protected by row-level security. Users cannot query or change another user's data.
