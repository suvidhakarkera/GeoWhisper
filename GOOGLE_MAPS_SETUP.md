# 🗺️ How to Get Google Maps API Key

## Step-by-Step Guide

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select a Project
- Click the project dropdown at the top
- Click "NEW PROJECT"
- Name it: "GeoWhisper"
- Click "CREATE"

### 3. Enable Maps JavaScript API
- In the search bar, type "Maps JavaScript API"
- Click on "Maps JavaScript API"
- Click "ENABLE"

### 4. Create API Key
- Go to "Credentials" (left sidebar)
- Click "CREATE CREDENTIALS" → "API key"
- Copy the API key that appears
- (Optional) Click "RESTRICT KEY" to add security:
  - Application restrictions: HTTP referrers
  - Add: http://localhost:3000/*
  - Add: http://localhost:*

### 5. Save Your API Key
Copy the key - you'll need it in the next step!

Example key format: `AIzaSyD1234567890abcdefghijklmnopqrstuvw`

---

## Important Notes

- ✅ **Free tier**: 28,000 map loads per month
- ✅ **Credit card required**: Google requires it but won't charge unless you exceed free tier
- ✅ **Security**: Restrict your key to localhost during development
- ✅ **Billing**: Enable billing in Google Cloud (required even for free tier)

---

## Quick Links

- **Google Cloud Console**: https://console.cloud.google.com
- **Enable APIs**: https://console.cloud.google.com/apis/library
- **Manage Keys**: https://console.cloud.google.com/apis/credentials
- **Pricing Info**: https://mapsplatform.google.com/pricing/

---

## Troubleshooting

**"This API project is not authorized to use this API"**
- Make sure Maps JavaScript API is enabled
- Wait 1-2 minutes after enabling

**"RefererNotAllowedMapError"**
- Add http://localhost:3000/* to allowed referrers
- Or remove restrictions for development

**Billing not enabled**
- Go to Billing in Google Cloud Console
- Add a payment method (required but won't be charged in free tier)
