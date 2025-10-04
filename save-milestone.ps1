# Save Progress to GitHub - Milestone Script
# Run this script to save current progress to your GitHub repository

Write-Host "🚀 Stanford Golf Calling Agent - Milestone Save Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if Git is available
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git not found"
    }
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or install GitHub Desktop from: https://desktop.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a Git repository
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/shanekoh/Stanford-Golf-calling-agent.git
}

# Check Git status
Write-Host "📋 Checking Git status..." -ForegroundColor Cyan
git status --porcelain

# Add all changes
Write-Host "➕ Adding all changes..." -ForegroundColor Cyan
git add .

# Create milestone commit
$commitMessage = "🎯 Milestone: Auto-Completion & Contact Selection Improvements

✨ Features:
- Fixed auto-completion logic for past scheduled calls
- Enhanced contact selection UI with better search
- Improved text overflow handling and spacing
- Added 30-second periodic status checks

🔧 Technical Changes:
- Fixed Flow collection issue in CallListViewModel
- Enhanced ContactSelectionScreen with clear button
- Improved AlarmScheduler boot recovery
- Added comprehensive error handling

🎨 UI/UX Improvements:
- Better contact card design with proper spacing
- Fixed text overlap issues
- Enhanced search experience
- Modern Material Design 3 styling

🐛 Bug Fixes:
- Past calls now auto-complete properly
- Contact selection text no longer overlaps
- Proper status updates with database reload
- Robust background processing

Ready for rollback and further development."

Write-Host "💾 Creating milestone commit..." -ForegroundColor Cyan
git commit -m $commitMessage

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
try {
    git push -u origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "🔗 View at: https://github.com/shanekoh/Stanford-Golf-calling-agent" -ForegroundColor Blue
} catch {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "You may need to authenticate with GitHub first" -ForegroundColor Yellow
    Write-Host "Try: git config --global user.name 'Your Name'" -ForegroundColor Yellow
    Write-Host "Try: git config --global user.email 'your.email@example.com'" -ForegroundColor Yellow
}

# Create a tag for this milestone
$tagName = "v1.2.0-auto-completion-improvements"
Write-Host "🏷️ Creating milestone tag: $tagName" -ForegroundColor Cyan
git tag -a $tagName -m "Milestone: Auto-Completion & Contact Selection Improvements"
git push origin $tagName

Write-Host "🎉 Milestone saved successfully!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor White
Write-Host "  - Commit: Auto-completion & Contact Selection Improvements" -ForegroundColor White
Write-Host "  - Tag: $tagName" -ForegroundColor White
Write-Host "  - Repository: https://github.com/shanekoh/Stanford-Golf-calling-agent" -ForegroundColor White

Read-Host "Press Enter to continue..."
