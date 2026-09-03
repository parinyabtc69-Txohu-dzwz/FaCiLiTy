@echo off
echo =======================================================
echo Starting Local Server for FaCiLiTy Web App...
echo =======================================================
echo.
echo Your web app will be available at: http://localhost:3000
echo (Please wait a moment for the server to start)
echo.
echo To stop the server, just close this window.
echo =======================================================
call npx serve -l 3000 .
pause
