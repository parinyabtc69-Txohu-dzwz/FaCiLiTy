@echo off
chcp 65001 >nul
echo =======================================================
echo Maintenance Mode Deployment...
echo =======================================================
echo.

echo [1/3] Setting maintenance page...
if exist index.html (
    ren index.html index_app.html
)
copy /y index_maintenance.html index.html
echo.

echo [2/3] Staging files...
git add index.html index_app.html
echo.

echo [3/3] Pushing to GitHub...
git commit -m "chore: auto maintenance mode"
git push
if %errorlevel% neq 0 (
    echo [ERROR] Failed to push to GitHub! Please check your internet connection.
    pause
    exit /b %errorlevel%
)
echo.

echo =======================================================
echo SUCCESS: Maintenance mode is now active!
echo =======================================================
pause