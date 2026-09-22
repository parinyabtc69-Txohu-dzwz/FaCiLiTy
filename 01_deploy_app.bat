@echo off
echo =======================================================
echo Building and Deploying to GitHub...
echo =======================================================
echo.

echo [1/4] Building the latest files...
call node build.js
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Please check the output above.
    pause
    exit /b %errorlevel%
)
echo.

echo [2/4] Staging files for Git...
git add .
echo.

echo [3/4] Committing changes...
set commitMessage=Auto deploy: %date% %time%
git commit -m "%commitMessage%"
echo.

echo [4/4] Pushing to GitHub...
git push
if %errorlevel% neq 0 (
    echo [ERROR] Git push failed! Please check your internet connection or GitHub permissions.
    pause
    exit /b %errorlevel%
)
echo.

echo =======================================================
echo SUCCESS: Code has been built and pushed to GitHub!
echo =======================================================
pause
