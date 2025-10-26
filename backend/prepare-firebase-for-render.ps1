# Script to convert firebase-key.json to base64 for Render deployment
# Run this in PowerShell from the backend directory

Write-Host "Converting Firebase key to Base64 for Render..." -ForegroundColor Cyan

$firebaseKeyPath = "src\main\resources\firebase-key.json"

if (Test-Path $firebaseKeyPath) {
    $content = Get-Content $firebaseKeyPath -Raw
    $bytes = [Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    
    Write-Host ""
    Write-Host "Base64 encoded Firebase config (copy this):" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Gray
    Write-Host $base64 -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the Base64 string above"
    Write-Host "2. Go to Render Dashboard -> Your Service -> Environment"
    Write-Host "3. Add environment variable:"
    Write-Host "   Key:   FIREBASE_CONFIG"
    Write-Host "   Value: <paste the base64 string>"
    Write-Host "4. Save changes and redeploy"
    
    # Also save to file for easy access
    $base64 | Out-File -FilePath "firebase-config-base64.txt" -Encoding UTF8
    Write-Host ""
    Write-Host "Also saved to: firebase-config-base64.txt" -ForegroundColor Green
} 
else {
    Write-Host "Error: firebase-key.json not found at $firebaseKeyPath" -ForegroundColor Red
    Write-Host "Make sure you're running this from the backend directory" -ForegroundColor Yellow
}
