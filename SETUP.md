# PayneDB Setup Guide

## 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com), create a new project, and note your:
- Project URL
- Anon/public key
- Service role key (Settings → API)

## 2. Configure Environment Variables

Edit `.env.local` and replace the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 3. Enable Email Auth

In Supabase Dashboard → Authentication → Providers, make sure **Email** is enabled.

## 4. Create Your First Admin User

1. Run the app: `npm run dev`
2. Go to `/signup` and create your account
3. In Supabase Dashboard → Authentication → Users, find your user
4. Click on the user → edit `raw_user_meta_data` → add `"role": "admin"`

Or run this in Supabase SQL editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your@email.com';
```

## 5. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Routes

| Route        | Description                    | Access       |
|--------------|--------------------------------|--------------|
| `/`          | Landing page                   | Public       |
| `/login`     | Sign in                        | Public       |
| `/signup`    | Create account                 | Public       |
| `/dashboard` | User profile & account info    | Logged in    |
| `/admin`     | User management panel          | Admin only   |
