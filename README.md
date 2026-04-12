# 🏊 AQUASTROKE - Comprehensive Swimming Training Management System

> A full-stack platform for swimming coaches and academies to manage training programs, track athlete performance, and communicate with parents.

## 📱 Overview

AQUASTROKE is a modern, scalable application built with:
- **Mobile App** (iOS/Android) - React Native + Expo
- **Web Platform** - React + TypeScript
- **Admin Dashboard** - React + TypeScript  
- **Backend** - Supabase (PostgreSQL)
- **Real-time** - Supabase Realtime
- **Deployment** - EAS Build (mobile), Netlify (web)

## 🎯 Key Features

### 🏊 Coach Dashboard
- ✅ 36-Week Training Plans (GPP, SPP1, SPP2, COMP, TAPER, CHAMP)
- ✅ Session Management & Drill Creation
- ✅ Athlete Tracking & Performance Analytics
- ✅ Trial Results Recording (T1, T2, T3)
- ✅ Attendance Management
- ✅ Absence Request Approval
- ✅ Real-time Notifications

### 👨‍👩‍👧 Parent Portal
- ✅ Daily Training Monitoring
- ✅ Absence Request Submission
- ✅ Performance Updates & Notifications
- ✅ Trial Results Viewing
- ✅ Coach Communication
- ✅ Attendance History

### 🏊‍♂️ Athlete Features
- ✅ Training Schedule View
- ✅ Performance Tracking
- ✅ Attendance Records
- ✅ Session Reminders

### 🏢 Academy Management
- ✅ Multi-Coach Support
- ✅ Squad Organization
- ✅ Subscription Plans (FREE, COACH, ACADEMY, ELITE)
- ✅ Reporting & Export

## 📁 Project Structure

```
aquastroke/
├── apps/
│   ├── mobile/                  # React Native (Expo)
│   │   ├── app/                 # Screens & Navigation
│   │   ├── components/          # Reusable Components
│   │   ├── context/             # Auth & Data Context
│   │   ├── hooks/               # Custom Hooks
│   │   ├── lib/                 # Utilities & Supabase
│   │   ├── assets/              # Images & Icons
│   │   ├── app.json             # Expo Config
│   │   └── package.json
│   │
│   ├── web/                     # React Web App
│   │   ├── src/
│   │   │   ├── pages/           # Page Components
│   │   │   ├── components/      # Reusable Components
│   │   │   ├── hooks/           # Custom Hooks
│   │   │   ├── services/        # API Services
│   │   │   ├── styles/          # CSS/Tailwind
│   │   │   └── App.tsx
│   │   ├── public/              # Static Assets
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin/                   # Admin Dashboard
│       ├── src/
│       ├── public/
│       └── package.json
│
├── packages/
│   ├── database/                # Supabase Schema & Migrations
│   │   ├── migrations/
│   │   ├── schema.sql
│   │   └── package.json
│   │
│   ├── shared/                  # Shared Types & Utils
│   │   ├── src/
│   │   │   ├── types/           # TypeScript Types
│   │   │   ├── utils/           # Utilities
│   │   │   └── constants/       # Constants
│   │   └── package.json
│   │
│   └── ui/                      # Shared UI Components
│       ├── src/
│       │   ├── components/      # Reusable Components
│       │   ├── hooks/           # UI Hooks
│       │   └── styles/          # Global Styles
│       └── package.json
│
├── docs/
│   ├── API.md                   # API Documentation
│   ├── SETUP.md                 # Setup Guide
│   ├── DEPLOYMENT.md            # Deployment Guide
│   └── ARCHITECTURE.md          # Architecture Overview
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD Pipeline
│
├── .gitignore
├── package.json                 # Root Package (Monorepo)
├── turbo.json                   # Turbo Config
├── tsconfig.json                # TypeScript Config
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Supabase Account

### 1. Clone Repository
```bash
git clone https://github.com/eslamelflah770-cmd/aquastroke.git
cd aquastroke
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Create `.env.local` in each app:

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

### 4. Setup Database
1. Go to Supabase Console
2. Run `packages/database/schema.sql`
3. Configure RLS policies

### 5. Start Development
```bash
# All apps
npm run dev

# Individual apps
cd apps/mobile && npm start
cd apps/web && npm run dev
cd apps/admin && npm run dev
```

## 📊 Database Schema

### Core Tables
- **academies** - Organization/Academy
- **users** - User Accounts
- **coaches** - Coach Profiles
- **athletes** - Swimmer Profiles
- **parents** - Parent/Guardian
- **seasons** - 36-Week Training Cycles
- **weekly_plans** - Weekly Structure
- **sessions** - Daily Sessions
- **drills** - Exercises

### Tracking Tables
- **attendance** - Attendance Records
- **absence_requests** - Parent Requests
- **trial_results** - Performance Benchmarks
- **progress_tracking** - Weekly Progress

### Communication
- **notifications** - In-App Alerts
- **messages** - Coach-Parent Chat
- **audit_logs** - System Audit Trail

## 🔐 Authentication & Authorization

### User Roles
- **Admin** - Full System Access
- **Coach** - Academy & Athlete Management
- **Parent** - Child Monitoring & Requests
- **Athlete** - Training & Performance View

### Row-Level Security (RLS)
All tables have RLS policies for data isolation.

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Mobile** | React Native, Expo, TypeScript |
| **Web** | React, Vite, TypeScript, Tailwind CSS |
| **Admin** | React, TypeScript, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Real-time** | Supabase Realtime |
| **Deployment** | EAS Build, Netlify |
| **Monorepo** | Turbo |

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start all apps
npm run dev:mobile      # Start mobile app
npm run dev:web         # Start web app
npm run dev:admin       # Start admin dashboard

# Building
npm run build           # Build all apps
npm run build:mobile    # Build mobile
npm run build:web       # Build web

# Testing & Linting
npm run test            # Run all tests
npm run lint            # Lint all apps
npm run format          # Format code

# Database
npm run db:push         # Run migrations

# Cleanup
npm run clean           # Clean all
```

## 🚢 Deployment

### Mobile (EAS Build)
```bash
cd apps/mobile
eas build --platform android
eas build --platform ios
```

### Web (Netlify)
```bash
cd apps/web
npm run build
# Deploy dist/ to Netlify
```

See `docs/DEPLOYMENT.md` for detailed instructions.

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Installation & Configuration
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to Production
- **[API Documentation](docs/API.md)** - API Endpoints & Examples
- **[Architecture](docs/ARCHITECTURE.md)** - System Design

## 🔗 Useful Links

- **GitHub**: https://github.com/eslamelflah770-cmd/aquastroke
- **Supabase**: https://app.supabase.com
- **Netlify**: https://app.netlify.com
- **Expo**: https://expo.dev
- **EAS Build**: https://eas.expo.dev

## 🐛 Troubleshooting

### Build Issues
```bash
npm run clean           # Clean all
npm install             # Reinstall
npm run build           # Rebuild
```

### Database Issues
- Check Supabase credentials
- Verify RLS policies
- Review SQL schema

### Deployment Issues
- Check GitHub Actions logs
- Verify environment variables
- Review build logs

## 📝 License

Proprietary - AQUASTROKE

## 📧 Support

For issues or questions:
- Create a GitHub issue
- Contact: support@aquastroke.com

## 🤝 Contributing

Internal team only. Contact project lead for access.

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: 🟢 Active Development
