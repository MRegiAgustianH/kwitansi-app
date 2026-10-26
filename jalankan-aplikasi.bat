@echo off
title Sistem Kwitansi MCU Rumah Sakit
color 0A

echo ==============================================================
echo    🏥 SISTEM KWITANSI MCU RUMAH SAKIT
echo    Klinik Utama Dr. H. A. Rotinsulu Cianjur
echo ==============================================================
echo.
echo Memulai server aplikasi...
echo Mohon tunggu sebentar, browser akan terbuka secara otomatis.
echo.

start "" "http://localhost:3000"

node launcher.js

pause
