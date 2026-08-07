@echo off
title Upload Memory Game to GitHub
echo.
echo ============================================
echo   UPLOAD MEMORY GAME TO GITHUB
echo ============================================
echo.
echo Step 1: A browser window will open.
echo         Click "Authorize" when GitHub asks.
echo.
pause

cd /d "C:\Users\user\OneDrive\Desktop\MemeryGame"

where gh >nul 2>&1
if errorlevel 1 (
  echo GitHub CLI not found. Installing...
  scoop install gh
)

echo.
echo Opening GitHub login...
gh auth login --hostname github.com --git-protocol https --web

if errorlevel 1 (
  echo.
  echo Login failed. Try again or use GitHub Desktop.
  pause
  exit /b 1
)

echo.
echo Step 2: Uploading your code...
git push -u origin main

if errorlevel 1 (
  echo.
  echo Push failed. See error above.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   SUCCESS! Code is on GitHub!
echo   https://github.com/samvelhambardzumyan05/memory-game
echo ============================================
echo.
pause
