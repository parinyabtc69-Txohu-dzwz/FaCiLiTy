@echo off
chcp 65001 >nul
echo =======================================================
echo เปิดโหมด "กำลังปรับปรุงระบบ" และอัปโหลดขึ้น GitHub...
echo =======================================================
echo.

echo [1/3] กำลังตั้งค่าหน้าปิดปรับปรุง...
if exist index.html (
    ren index.html index_app.html
)
copy /y index_maintenance.html index.html
echo.

echo [2/3] กำลังเตรียมไฟล์ (Staging)...
git add index.html index_app.html
echo.

echo [3/3] กำลังอัปโหลดขึ้น GitHub...
git commit -m "chore: auto maintenance mode"
git push
if %errorlevel% neq 0 (
    echo [ERROR] ไม่สามารถพุชขึ้น GitHub ได้ กรุณาตรวจสอบอินเทอร์เน็ต
    pause
    exit /b %errorlevel%
)
echo.

echo =======================================================
echo SUCCESS: เปิดโหมดปรับปรุงระบบเรียบร้อยแล้ว!
echo =======================================================
pause
