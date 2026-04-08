# AQUASTROKE - Setup Guide

## 🚀 Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm or yarn
- Git (https://git-scm.com/)
- Supabase Account (https://supabase.com/)
- GitHub Account (https://github.com/)
- Netlify Account (https://netlify.com/)

## 📋 Step-by-Step Setup

### 1. Clone Repository
```bash
git clone https://github.com/eslamelflah770-cmd/aquastroke.git
cd aquastroke
```

### 2. Install Dependencies
```bash
npm install
```

This will install dependencies for all apps and packages in the monorepo.

### 3. Setup Supabase Database

#### Create Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for initialization

#### Run Schema
1. Go to **SQL Editor**
2. Click "New Query"
3. Copy content from `packages/database/schema.sql`
4. Paste and run

#### Get Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL** and **Anon Key**

### 4. Setup Environment Variables

Create `.env.local` files in each app:

**apps/mobile/.env.local:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**apps/web/.env.local:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**apps/admin/.env.local:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Start Development

```bash
# All apps
npm run dev

# Individual apps
cd apps/mobile && npm start
cd apps/web && npm run dev
cd apps/admin && npm run dev
```

## 📱 Mobile App Setup

```bash
cd apps/mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on Web
npm run web
```

### Expo Go Testing
1. Install Expo Go on your phone
2. Scan QR code from terminal
3. App loads on your phone

## 🌐 Web Platform Setup

```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit http://localhost:5173

## 🏢 Admin Dashboard Setup

```bash
cd apps/admin

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit http://localhost:5174

## 🔐 GitHub Setup

### Create Repository
1. Go to https://github.com/new
2. Name: `aquastroke`
3. Description: "Comprehensive Swimming Training Management System"
4. Make it Public
5. Click "Create repository"

### Push Code
```bash
cd aquastroke
git remote add origin https://github.com/your-username/aquastroke.git
git branch -M main
git push -u origin main
```

### Add Secrets
1. Go to repository Settings
2. Secrets and variables → Actions
3. Add secrets:
   - `EXPO_TOKEN` - From https://expo.dev/settings/tokens
   - `NETLIFY_AUTH_TOKEN` - From https://app.netlify.com/user/settings/personal-access-tokens
   - `NETLIFY_SITE_ID` - From Netlify dashboard

## 🌐 Netlify Setup

### Connect Repository
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select GitHub
4. Choose `aquastroke` repository
5. Configure:
   - **Build command**: `npm run build:web`
   - **Publish directory**: `apps/web/dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy

### Custom Domain
1. Go to Site settings
2. Domain management
3. Add custom domain

## 📱 EAS Build Setup

### Login to Expo
```bash
npm install -g eas-cli
eas login
```

### Configure Project
```bash
cd apps/mobile
eas build:configure
```

### Build for Android
```bash
eas build --platform android
```

### Build for iOS
```bash
eas build --platform ios
```

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Run Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Supabase Connection Failed
- Check credentials in `.env.local`
- Verify Supabase project is running
- Check network connection

### Build Fails
```bash
npm run clean
npm install
npm run build
```

### Mobile App Won't Load
- Check Supabase credentials in app.json
- Verify internet connection
- Check Expo Go is up to date

## 📚 Next Steps

1. Read [Deployment Guide](DEPLOYMENT.md)
2. Review [API Documentation](API.md)
3. Check [Architecture Overview](ARCHITECTURE.md)

---

**Last Updated**: April 2026
