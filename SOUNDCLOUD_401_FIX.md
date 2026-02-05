# SoundCloud 401 Authorization Error - How to Fix

## 🔴 The Error You're Seeing

```json
{
  "code": 401,
  "message": "A request must contain the Authorization header. For details please refer to https://developers.soundcloud.com/blog/security-updates-api.",
  "status": "401 - Unauthorized"
}
```

## 🎯 What This Means

The credentials in your `.env` file **have not been registered** with SoundCloud as an official app. SoundCloud requires all OAuth apps to be registered through their developer portal.

## ⚠️ Current Credentials Are Invalid

The credentials you have:
```env
SOUNDCLOUD_CLIENT_ID=hblQJr0OTMtgxC8zea1IzP3uV0nrAzeV
SOUNDCLOUD_CLIENT_SECRET=OqrdzbBW1WFYTQxKH04nABQvy97U3v32
```

These are **placeholder/example values** and are not registered with SoundCloud.

## ✅ How to Fix (2 Options)

### Option 1: Register Your Own SoundCloud App (Recommended)

1. **Go to SoundCloud Developers**
   - Visit: https://soundcloud.com/you/apps
   - Sign in with your SoundCloud account

2. **Register a New App**
   - Click "Register a new app" or "Create App"
   - Fill in the form:
     - **App Name**: `Apes On Ape Jukebox`
     - **Description**: `Music player for Apes On Ape community`
     - **Redirect URI**: `http://localhost:3000/api/auth/soundcloud/callback`
     - **Website**: Your website URL

3. **Get Your Credentials**
   - After registration, SoundCloud will give you:
     - **Client ID** (a long alphanumeric string)
     - **Client Secret** (another long alphanumeric string)

4. **Update Your `.env` File**
   ```env
   SOUNDCLOUD_CLIENT_ID=your_real_client_id_here
   SOUNDCLOUD_CLIENT_SECRET=your_real_client_secret_here
   SOUNDCLOUD_REDIRECT_URI=http://localhost:3000/api/auth/soundcloud/callback
   ```

5. **Restart Your Dev Server**
   ```bash
   npm run dev
   ```

### Option 2: Disable the Connect Button (Quick Fix)

If you don't need the OAuth connection feature, you can simply:

1. Comment out or hide the Connect Account button
2. The jukebox will work perfectly without it
3. All features (playback, stats, rankings) work without OAuth

To hide it, edit `app/music/page.tsx` and comment out the Connect Account section.

## 🎵 Good News: OAuth is Optional!

**The jukebox works perfectly without connecting a SoundCloud account:**

✅ Music playback  
✅ Album selection  
✅ Stats display (followers, tracks, plays, likes, reposts)  
✅ Top 10 tracks ranking  
✅ Jukebox animations  
✅ All albums from your SoundCloud  

**OAuth only adds:**
- Display of connected user's profile
- Potential for personalized features in future

## 🔍 Why Did This Happen?

SoundCloud updated their API security in recent years. They now require:
1. All OAuth apps to be properly registered
2. Authorization headers for API requests
3. Proper redirect URIs that match your registration

Random or example credentials will be rejected with a 401 error.

## 📋 For Production Deployment

When you deploy to production:

1. **Update Redirect URI** in SoundCloud app settings:
   ```
   https://yourdomain.com/api/auth/soundcloud/callback
   ```

2. **Update Environment Variables** on your hosting platform:
   ```env
   SOUNDCLOUD_REDIRECT_URI=https://yourdomain.com/api/auth/soundcloud/callback
   ```

3. **Ensure HTTPS** is enabled (required by SoundCloud)

## 🆘 Still Having Issues?

1. **Check SoundCloud Developer Console**
   - https://soundcloud.com/you/apps
   - Verify your app is active and approved

2. **Verify Redirect URI Matches Exactly**
   - In SoundCloud app settings
   - In your `.env` file
   - No trailing slashes
   - Same protocol (http/https)

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for detailed error messages
   - Check Network tab for failed requests

4. **Read SoundCloud's Documentation**
   - https://developers.soundcloud.com/docs/api/guide
   - https://developers.soundcloud.com/docs/api/authentication

## 🎯 Quick Summary

**Current State:** Credentials are invalid/unregistered  
**Fix:** Register app at https://soundcloud.com/you/apps  
**Alternative:** Simply ignore the Connect button - everything else works!  
**Time to Fix:** 5-10 minutes to register app  

The 401 error is **normal** when using unregistered credentials. Just register your app and you're good to go! 🎵✨
