@echo off
SET MONGOD_PATH="C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
SET DATA_PATH="C:\data\db"

echo --------------------------------------------------
echo 🚀 STARTING MONGODB (SES SYSTEM REPAIR)
echo --------------------------------------------------

:: Try starting as a service first
echo [1/2] Attempting to start MongoDB Service...
net start MongoDB
if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB Service started successfully!
    goto end
)

echo ⚠️ Service could not start. Attempting manual start...

:: Check if data directory exists
if not exist %DATA_PATH% (
    echo 📂 Creating data directory at %DATA_PATH%...
    mkdir %DATA_PATH%
)

:: Try starting directly
echo [2/2] Starting MongoDB manually from: %MONGOD_PATH%
start /b "" %MONGOD_PATH% --dbpath %DATA_PATH%

if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB is now running in the background!
) else (
    echo ❌ FAILED. Please install MongoDB or use Cloud URI.
)

:end
echo --------------------------------------------------
echo 💡 TIP: For a permanent fix that works after deployment,
echo      please use MongoDB Atlas (Cloud).
echo --------------------------------------------------
pause
