@echo off
echo ============================================
echo    Get Firebase Web App Configuration
echo ============================================
echo.
echo Follow these steps:
echo.
echo 1. Go to Firebase Console:
echo    https://console.firebase.google.com/project/geowhisper-1/settings/general
echo.
echo 2. Scroll down to "Your apps" section
echo.
echo 3. If you see a Web app (^<^/^>):
echo    - Click the gear icon or "Config" 
echo    - Copy all the values
echo.
echo 4. If NO web app exists:
echo    - Click "Add app"
echo    - Select Web icon (^<^/^>)
echo    - App nickname: GeoWhisper Web
echo    - Click "Register app"
echo    - Copy the firebaseConfig values
echo.
echo 5. Update .env.local with the values
echo.
echo ============================================
echo    Press any key to open Firebase Console
echo ============================================
pause
start https://console.firebase.google.com/project/geowhisper-1/settings/general
