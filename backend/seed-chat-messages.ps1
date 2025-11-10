# Quick Chat Message Seeding Script
# This script sends sample chat messages to test the chat summary feature

$API_BASE = "http://localhost:8080/api"
$towerId = "RwvBgwnDbPsupDsZ7rH1"  # Change this to your tower ID
$messageCount = 15

# Sample messages
$messages = @(
    "This coffee shop is amazing! The atmosphere is perfect for working.",
    "Great cappuccino here! Highly recommend it.",
    "Love the ambiance and decor. Very cozy!",
    "The wifi is super fast, perfect for remote work.",
    "Best latte I've had in ages!",
    "Friendly staff and excellent service.",
    "Try the chocolate croissant - it's delicious!",
    "Perfect spot for meetings with clients.",
    "The view from here is spectacular!",
    "Food here is absolutely delicious!",
    "Service was quick and friendly.",
    "This place is a hidden gem!",
    "Great location, easy to find.",
    "Very clean and well-maintained.",
    "Outdoor seating is lovely."
)

$usernames = @("Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Skylar")

Write-Host "`n🌱 Seeding Chat Messages for Tower: $towerId" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$successCount = 0
$failCount = 0

for ($i = 0; $i -lt $messageCount; $i++) {
    $randomMessage = $messages | Get-Random
    $randomUsername = $usernames | Get-Random
    $randomUserId = "user$(Get-Random -Minimum 100 -Maximum 999)"
    
    $body = @{
        towerId = $towerId
        userId = $randomUserId
        username = $randomUsername
        message = $randomMessage
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/chat/send" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "✓ Message $($i+1)/$messageCount`: `"$randomMessage`" - $randomUsername" -ForegroundColor Green
        $successCount++
        Start-Sleep -Milliseconds 200  # Small delay between messages
    }
    catch {
        Write-Host "✗ Failed to send message $($i+1): $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "✅ Seeding Complete!" -ForegroundColor Green
Write-Host "   Success: $successCount" -ForegroundColor Green
Write-Host "   Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })

Write-Host "`n📊 Now test the chat summary API:" -ForegroundColor Cyan
Write-Host "   POST $API_BASE/chat/summary" -ForegroundColor White
Write-Host "   Body: { `"towerId`": `"$towerId`", `"messageLimit`": 100, `"timeRangeHours`": 24 }" -ForegroundColor White
Write-Host ""
