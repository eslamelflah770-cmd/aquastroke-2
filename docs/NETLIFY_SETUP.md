# Netlify Deployment Guide

## 🚀 Quick Setup

### Step 1: Create Netlify Sites

1. Go to https://app.netlify.com
2. Click "Add new site"
3. Choose "Deploy manually"
4. Create two sites:
   - **aquastroke-web** (for Web Platform)
   - **aquastroke-admin** (for Admin Dashboard)

### Step 2: Get Site IDs

For each site:
1. Go to Site settings
2. Copy the **Site ID** (looks like: `abc123def456`)

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/eslamelflah770-cmd/aquastroke-2
2. Settings → Secrets and variables → Actions
3. Add these secrets:

```
NETLIFY_AUTH_TOKEN = nfp_B9PQquBVEhWiWwGsgPD2EpGK4ThN5TLQbf90
NETLIFY_SITE_ID_WEB = <your-web-site-id>
NETLIFY_SITE_ID_ADMIN = <your-admin-site-id>
```

### Step 4: Deploy

Push to main branch:
```bash
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

GitHub Actions will automatically:
1. Build both apps
2. Deploy to Netlify
3. Show deployment status

## 📊 Deployment Status

Check deployment progress:
1. Go to your repository
2. Click "Actions" tab
3. View the workflow run

## 🔗 Access Your Sites

After deployment:
- **Web Platform**: https://aquastroke-web.netlify.app
- **Admin Dashboard**: https://aquastroke-admin.netlify.app

## 🔄 Automatic Deployments

Every time you push to `main`:
1. GitHub Actions runs the workflow
2. Apps are built
3. Deployed to Netlify automatically

## 📝 Environment Variables

If you need environment variables on Netlify:

1. Go to Site settings
2. Build & deploy → Environment
3. Add your variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 🆘 Troubleshooting

### Build fails
- Check Node.js version (18+)
- Verify dependencies: `npm ci`
- Check TypeScript errors: `npm run build`

### Deploy fails
- Verify Site IDs are correct
- Check Netlify Auth Token
- Ensure GitHub secrets are set

### Site not updating
- Check GitHub Actions workflow status
- Verify push was to `main` branch
- Check Netlify deployment logs

## 📚 More Info

- [Netlify Docs](https://docs.netlify.com)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
