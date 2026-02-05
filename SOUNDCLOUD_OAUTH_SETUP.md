# SoundCloud OAuth Setup Guide

The "Connect Account" button requires setting up a SoundCloud OAuth application. Follow these steps:

## 📋 Prerequisites

You need a SoundCloud account and access to register applications.

## 🔧 Setup Steps

### 1. Register Your App on SoundCloud

1. Go to [SoundCloud for Developers](https://soundcloud.com/you/apps)
2. Click **"Register a new app"** or **"Create App"**
3. Fill in the required information:
   - **App Name**: `Apes On Ape Music`
   - **App Description**: `Music jukebox for Apes On Ape community`
   - **Redirect URI**: `http://localhost:3000/api/auth/soundcloud/callback`
     - For production: `https://yourdomain.com/api/auth/soundcloud/callback`
   - **Website URL**: Your website URL

### 2. Get Your Credentials

After creating the app, SoundCloud will provide:
- **Client ID** (also called App ID)
- **Client Secret**

### 3. Update Your Environment Variables

Update your `.env` or `.env.local` file with the credentials:

```env
SOUNDCLOUD_CLIENT_ID=your_actual_client_id_here
SOUNDCLOUD_CLIENT_SECRET=your_actual_client_secret_here
SOUNDCLOUD_REDIRECT_URI=http://localhost:3000/api/auth/soundcloud/callback
SOUNDCLOUD_USER_URL=https://soundcloud.com/apesonape
```

### 4. Restart Your Development Server

```bash
npm run dev
```

## ⚠️ Important Notes

### Current Credentials Are Invalid

The credentials currently in your `.env` file:
- `SOUNDCLOUD_CLIENT_ID=hblQJr0OTMtgxC8zea1IzP3uV0nrAzeV`
- `SOUNDCLOUD_CLIENT_SECRET=OqrdzbBW1WFYTQxKH04nABQvy97U3v32`

These appear to be example/placeholder values and won't work for OAuth unless you've registered them with SoundCloud.

### Redirect URI Must Match

The redirect URI in your SoundCloud app settings **must exactly match** the one in your `.env` file.

- **Development**: `http://localhost:3000/api/auth/soundcloud/callback`
- **Production**: `https://yourdomain.com/api/auth/soundcloud/callback`

### OAuth is Optional

The "Connect Account" feature is **optional**. The music page will work fine without it:
- ✅ Music playback works
- ✅ Album selection works
- ✅ Stats display works
- ✅ Top tracks work

OAuth connection only adds:
- User profile display
- Potential for personalized features in the future

## 🐛 Troubleshooting

### "Failed to connect to SoundCloud"

**Causes:**
1. Invalid Client ID/Secret
2. Redirect URI mismatch
3. SoundCloud app not properly registered

**Solution:**
- Verify your credentials on the [SoundCloud Apps page](https://soundcloud.com/you/apps)
- Ensure the redirect URI matches exactly
- Check browser console for detailed error messages

### Button Does Nothing

**Causes:**
1. Client ID is missing or invalid
2. Browser blocked the redirect
3. JavaScript error

**Solution:**
- Open browser developer console (F12)
- Look for error messages
- Check the Network tab for failed requests to `/api/auth/soundcloud`

## 📚 Resources

- [SoundCloud API Documentation](https://developers.soundcloud.com/docs/api/guide)
- [OAuth 2.1 with PKCE](https://developers.soundcloud.com/docs/api/authentication)

## 🚀 For Production Deployment

When deploying to production:

1. Update redirect URI in SoundCloud app settings
2. Update `SOUNDCLOUD_REDIRECT_URI` in production environment variables
3. Ensure HTTPS is used (SoundCloud requires it for production)

```env
SOUNDCLOUD_REDIRECT_URI=https://apesonape.io/api/auth/soundcloud/callback
```
