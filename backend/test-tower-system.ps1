# Tower System Test Script

# Test the tower system to ensure consistent grouping

# Base URL
$BASE_URL = "http://localhost:8080/api"

# Test 1: Create first post (should create a tower)
Write-Host "Test 1: Creating first post..." -ForegroundColor Cyan
$post1 = @{
    content = "First post at this location"
    latitude = 28.6139
    longitude = 77.2090
} | ConvertTo-Json

curl.exe -X POST "$BASE_URL/posts" `
    -H "X-User-Id: testuser1" `
    -H "X-Username: TestUser1" `
    -H "Content-Type: application/json" `
    -d $post1

Write-Host "`nWaiting 2 seconds...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test 2: Create second post nearby (should join same tower)
Write-Host "Test 2: Creating second post nearby (within 50m)..." -ForegroundColor Cyan
$post2 = @{
    content = "Second post nearby"
    latitude = 28.6140
    longitude = 77.2091
} | ConvertTo-Json

curl.exe -X POST "$BASE_URL/posts" `
    -H "X-User-Id: testuser2" `
    -H "X-Username: TestUser2" `
    -H "Content-Type: application/json" `
    -d $post2

Write-Host "`nWaiting 2 seconds...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test 3: Create third post far away (should create new tower)
Write-Host "Test 3: Creating third post far away (new tower)..." -ForegroundColor Cyan
$post3 = @{
    content = "Third post far away"
    latitude = 28.6200
    longitude = 77.2150
} | ConvertTo-Json

curl.exe -X POST "$BASE_URL/posts" `
    -H "X-User-Id: testuser3" `
    -H "X-Username: TestUser3" `
    -H "Content-Type: application/json" `
    -d $post3

Write-Host "`nWaiting 2 seconds...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test 4: Get towers (first call)
Write-Host "Test 4: Getting towers (FIRST CALL)..." -ForegroundColor Cyan
$towersRequest = @{
    clusterRadiusMeters = 50
    maxPosts = 1000
} | ConvertTo-Json

Write-Host "Response:" -ForegroundColor Green
curl.exe -X POST "$BASE_URL/posts/towers" `
    -H "Content-Type: application/json" `
    -d $towersRequest

Write-Host "`n`nWaiting 2 seconds...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test 5: Get towers again (should be IDENTICAL)
Write-Host "Test 5: Getting towers (SECOND CALL - should be IDENTICAL)..." -ForegroundColor Cyan
Write-Host "Response:" -ForegroundColor Green
curl.exe -X POST "$BASE_URL/posts/towers" `
    -H "Content-Type: application/json" `
    -d $towersRequest

Write-Host "`n`n=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "Expected Results:" -ForegroundColor Yellow
Write-Host "- Should see 2 towers total" -ForegroundColor White
Write-Host "- Tower 1: 2 posts (post1 and post2)" -ForegroundColor White
Write-Host "- Tower 2: 1 post (post3)" -ForegroundColor White
Write-Host "- Both API calls should return IDENTICAL results" -ForegroundColor White
Write-Host "`nCheck the responses above to verify!" -ForegroundColor Cyan
