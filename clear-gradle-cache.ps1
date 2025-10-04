# PowerShell script to clear corrupted Gradle cache
# Run this script when you encounter cache corruption errors

Write-Host "Clearing Gradle cache..." -ForegroundColor Yellow

# Clear global Gradle cache
Write-Host "Removing global Gradle cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches" -ErrorAction SilentlyContinue

# Clear local project cache
Write-Host "Removing local project cache..." -ForegroundColor Cyan
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue

# Clear build directory
Write-Host "Removing build directory..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue

Write-Host "Cache cleared successfully!" -ForegroundColor Green
Write-Host "You can now run: .\gradlew clean assembleDebug --no-daemon --no-build-cache" -ForegroundColor Yellow




