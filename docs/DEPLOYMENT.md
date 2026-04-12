# AQUASTROKE - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- GitHub account with repository access
- Netlify account (https://netlify.com)
- Supabase project (already set up)

---

## 📱 Mobile App Deployment (EAS Build)

### Step 1: Setup EAS
```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build:configure
```

### Step 2: Build for Android
```bash
eas build --platform android
```

### Step 3: Build for iOS
```bash
eas build --platform ios
```

### Step 4: Download & Test
- Visit https://expo.dev/accounts/sam34q/projects/aquastroke/builds
- Download APK or IPA file
- Install on device

---

## 🌐 Web Platform Deployment (Netlify)

### Option 1: Manual Deployment (Recommended for First Time)

#### Step 1: Build Locally
```bash
cd apps/web
npm install
npm run build
```

#### Step 2: Deploy to Netlify
```bash
netlify deploy --prod --dir=dist --auth=nfp_B9PQquBVEhWiWwGsgPD2EpGK4ThN5TLQbf90
```

#### Step 3: Access Your Site
- Your site will be available at: `https://aquastroke-web.netlify.app`

---

### Option 2: Automatic Deployment (GitHub Actions)

#### Step 1: Create Netlify Sites
1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Create site: `aquastroke-web`
4. Copy the **Site ID**

#### Step 2: Add GitHub Secrets
1. Go to: https://github.com/eslamelflah770-cmd/aquastroke-2/settings/secrets/actions
2. Add these secrets:
   ```
   NETLIFY_AUTH_TOKEN = nfp_B9PQquBVEhWiWwGsgPD2EpGK4ThN5TLQbf90
   NETLIFY_SITE_ID_WEB = <your-site-id>
   ```

#### Step 3: Push to GitHub
```bash
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

#### Step 4: Monitor Deployment
- Go to: https://github.com/eslamelflah770-cmd/aquastroke-2/actions
- Watch the workflow run
- Site updates automatically after build succeeds

---

## 🏢 Admin Dashboard Deployment (Netlify)

### Same as Web Platform

#### Step 1: Build Locally
```bash
cd apps/admin
npm install
npm run build
```

#### Step 2: Deploy to Netlify
```bash
netlify deploy --prod --dir=dist --auth=nfp_B9PQquBVEhWiWwGsgPD2EpGK4ThN5TLQbf90
```

#### Step 3: Access Your Site
- Your site will be available at: `https://aquastroke-admin.netlify.app`

---

## 🗄️ Database Setup (Supabase)

### Step 1: Run Schema
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click "New Query"
5. Copy content from `packages/database/schema.sql`
6. Paste and run

### Step 2: Configure Environment Variables

#### For Web Platform
Create `apps/web/.env.local`:
```env
VITE_SUPABASE_URL=https://vunkrwcmxsmraogiuhmm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### For Admin Dashboard
Create `apps/admin/.env.local`:
```env
VITE_SUPABASE_URL=https://vunkrwcmxsmraogiuhmm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### For Mobile App
Update `apps/mobile/app.json`:
```json
{
  "env": {
    "supabaseUrl": "https://vunkrwcmxsmraogiuhmm.supabase.co",
    "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📊 Deployment Status

### Check Builds
- **Mobile**: https://expo.dev/accounts/sam34q/projects/aquastroke/builds
- **Web**: https://app.netlify.com/sites/aquastroke-web
- **Admin**: https://app.netlify.com/sites/aquastroke-admin

### Monitor GitHub Actions
- https://github.com/eslamelflah770-cmd/aquastroke-2/actions

---

## 🔄 Update Deployment

### Update Mobile App
```bash
cd apps/mobile
git add .
git commit -m "Update mobile app"
git push origin main
# Then run: eas build --platform android
```

### Update Web Platform
```bash
cd apps/web
git add .
git commit -m "Update web platform"
git push origin main
# Netlify auto-deploys on push
```

### Update Admin Dashboard
```bash
cd apps/admin
git add .
git commit -m "Update admin dashboard"
git push origin main
# Netlify auto-deploys on push
```

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Netlify Deploy Fails
- Check build logs: https://app.netlify.com/sites/aquastroke-web/deploys
- Verify environment variables are set
- Ensure `dist` folder exists after build

### Mobile App Won't Connect
- Check Supabase URL and Key in `app.json`
- Verify internet connection
- Check Expo Go is up to date

### GitHub Actions Fails
- Check workflow logs: https://github.com/eslamelflah770-cmd/aquastroke-2/actions
- Verify Node.js version (18+)
- Check npm dependencies

---

## 📚 Resources

- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎯 Production Checklist

- [ ] Database schema deployed to Supabase
- [ ] Environment variables configured
- [ ] Mobile app built and tested
- [ ] Web platform deployed to Netlify
- [ ] Admin dashboard deployed to Netlify
- [ ] GitHub Actions workflow passing
- [ ] SSL certificates active
- [ ] Domain names configured
- [ ] Monitoring and logging enabled
- [ ] Backup strategy in place

---

**Last Updated**: April 2026
