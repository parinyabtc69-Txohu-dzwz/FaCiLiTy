@echo off
chcp 65001 > nul
echo ===================================
echo   ระบบ Build และ Push ขึ้น GitHub
echo ===================================
echo.
echo [1/3] กำลัง Build โค้ดเพื่อรวมไฟล์...
node build.js
if %errorlevel% neq 0 (
    echo [Error] การ Build ล้มเหลว กรุณาตรวจสอบ Error!
    pause
    exit /b %errorlevel%
)
echo.
echo [2/3] กำลังเตรียมไฟล์เพื่ออัปเดต (Git Add)...
git add .
echo.
set /p commit_msg="กรุณาใส่ข้อความบอกการอัปเดต (Commit Message): "
if "%commit_msg%"=="" set commit_msg="อัปเดตระบบอัตโนมัติ"
git commit -m "%commit_msg%"
echo.
echo [3/3] กำลังส่งขึ้น GitHub...
git push origin main
echo.
echo ===================================
echo       ส่งโค้ดขึ้น Github สำเร็จ!
echo ===================================
pause
