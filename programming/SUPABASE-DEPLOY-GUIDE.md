# KSU SmartPlan — Supabase setup

## What this version connects
- Registration and login use Supabase Auth (email + password).
- Student profile fields are stored in `public.student_profiles`.
- Row Level Security (RLS) lets an authenticated student read/update only their own profile.
- Existing pages still use a small browser-local compatibility cache for the old UI. **Course selections, GPA, timetable, credit tracker, profile photo, and other academic data are not yet fully synced to the cloud**; those features need a separate data-migration pass.
- The previous demo reset flow is replaced by Supabase email password-reset links. Configure the Supabase redirect URL for `index.html` / your deployed site as described below.

## Step 1 — Create Supabase project
1. Open https://supabase.com/dashboard and create a project.
2. Open Project Settings → API (or API Keys). Copy the Project URL and the publishable/anon public key.
3. In this ZIP, open `js/supabase-config.js` and replace `https://YOUR_PROJECT_REF.supabase.co` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with your values.
4. Never put a `service_role` or secret key in this file.

## Step 2 — Create table and security rules
1. In Supabase, open SQL Editor → New query.
2. Paste all of `SUPABASE-SETUP.sql` and click Run.
3. In Table Editor, verify `student_profiles` exists and RLS is enabled.

## Step 3 — Authentication settings
1. Open Authentication → Providers / Sign In and make sure Email is enabled.
2. For production, keep email confirmation enabled. Users must confirm their email before logging in. For a classroom demo only, you can disable confirmation in Supabase Auth settings if you understand the trade-off.
3. Open Authentication → URL Configuration. Set Site URL to your deployed Netlify URL, e.g. `https://YOUR-SITE.netlify.app`. Add that URL and its `index.html` path to Redirect URLs.
4. For password reset, verify the deployed URL is allowed as a redirect URL.

## Step 4 — Deploy to Netlify
1. Extract this ZIP. Upload the **contents** of the `KSU-SmartPlan-Final - Copy` folder to the root of your GitHub repository (so `index.html` is at the repository root).
2. Commit and push. Netlify should redeploy automatically if connected to that repository.
3. Open the site, create a test account using an email you can access, and confirm the email if confirmation is enabled.
4. Log in with that email and password.
5. In Supabase → Table Editor → `student_profiles`, verify a profile row was created.

## Important
- Student ID must be one English letter followed by 10 digits, matching the existing form validation.
- Email is now required for secure Supabase Auth and password recovery. Login uses email instead of Student ID.
- The frontend uses only the public publishable/anon key; RLS is the security boundary.
- Existing local-only demo accounts will not automatically become Supabase accounts. Students must register again.
- Test first with a new test account; keep a backup of the existing deployed site.
