# Mapbox Setup Guide

This guide will help you set up Mapbox for GeoWhisper in under 5 minutes.

## Why Mapbox?

✅ **100,000 free map loads per month** - Perfect for development and small projects  
✅ **Beautiful dark theme maps** - Matches our app design  
✅ **Powerful features** - Geolocation, custom markers, popups, 3D terrain  
✅ **Better performance** - Faster than OpenStreetMap for interactive maps  
✅ **No credit card required** for free tier

## Quick Setup (2 minutes)

### Step 1: Create a Free Mapbox Account

1. Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
2. Sign up with your email or GitHub account
3. Verify your email address

### Step 2: Get Your Access Token

1. After logging in, you'll be on the [Account Dashboard](https://account.mapbox.com/)
2. Scroll down to the **Access tokens** section
3. Copy your **Default public token** (starts with `pk.`)

### Step 3: Add Token to Your Project

1. In the `frontend` folder, create a `.env.local` file (if it doesn't exist)
2. Add this line:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
   ```
3. Replace `pk.YOUR_ACTUAL_TOKEN_HERE` with the token you copied

**Example:**
```env
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXh5ejEyMzB4Y3gycW82Z2FiY2RlZmdoIn0.AbCdEfGhIjKlMnOpQrStUv
```

### Step 4: Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## Verify It's Working

1. Navigate to the Hot Zones page (http://localhost:3000/hot-zones)
2. You should see a dark-themed map with your location
3. If you see "Mapbox token is required", check your `.env.local` file

## Usage Limits (Free Tier)

- ✅ **100,000 map loads per month** (loads = page views with map)
- ✅ **50,000 static API requests**
- ✅ **Unlimited geolocation requests**
- ✅ **No credit card required**
- ✅ **No expiration**

For a small app or development, you'll likely never hit these limits!

## Token Security

### ✅ SAFE - Public Token (pk.)
- **Used in frontend** (browser)
- **Safe to expose** in client-side code
- **URL restrictions available** (optional)

### ⚠️ KEEP SECRET - Secret Token (sk.)
- **Never use in frontend**
- **Only for server-side** operations
- **Keep in .env, never commit**

## Troubleshooting

### "Mapbox token is required" Error
**Solution:** Make sure `.env.local` has the token and restart dev server

### Map Not Loading
**Solutions:**
1. Check browser console for errors
2. Verify token starts with `pk.`
3. Clear browser cache and reload
4. Ensure you're using `NEXT_PUBLIC_` prefix

### "401 Unauthorized" Error
**Solutions:**
1. Token might be invalid - get a new one from Mapbox
2. Token might be restricted - check URL restrictions in Mapbox dashboard
3. Token expired (very rare) - create a new token

### Map Shows But No Markers
**Solution:** This is likely a location permission issue:
1. Check browser console
2. Allow location permissions when prompted
3. Verify backend API is running (http://localhost:8080)

## Advanced: Create a Custom Token

If you want more control, create a custom token:

1. Go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Click **Create a token**
3. Give it a name (e.g., "GeoWhisper Development")
4. Select scopes:
   - ✅ `styles:tiles` (required for maps)
   - ✅ `styles:read` (required for styles)
   - ✅ `fonts:read` (required for text)
5. *Optional:* Add URL restrictions (e.g., `http://localhost:3000/*`)
6. Click **Create token**
7. Copy and use in `.env.local`

## Resources

- 📚 [Mapbox Documentation](https://docs.mapbox.com/)
- 🎨 [Map Styles Gallery](https://www.mapbox.com/gallery/)
- 💻 [React Map GL Examples](https://visgl.github.io/react-map-gl/)
- 🆘 [Mapbox Support](https://support.mapbox.com/)

## Need Help?

- Check the [Mapbox Community](https://community.mapbox.com/)
- Review our [API Documentation](../backend/API_DOCUMENTATION.md)
- Check browser console for error messages

---

**That's it!** You should now have a working Mapbox integration. 🎉
