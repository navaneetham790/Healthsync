@echo off
setlocal
set "PROJECT_ROOT=%~dp0"

echo Starting HealthSync services...

start "HealthSync Gateway" /D "%PROJECT_ROOT%Healthsync-backend\gateway" cmd /k "node index.js"
start "HealthSync User Service" /D "%PROJECT_ROOT%Healthsync-backend\user-service" cmd /k ".\mvnw.cmd spring-boot:run"
start "HealthSync Health Service" /D "%PROJECT_ROOT%Healthsync-backend\health-service" cmd /k ".\mvnw.cmd spring-boot:run"
start "HealthSync ML Service" /D "%PROJECT_ROOT%Healthsync-backend\ml-service" cmd /k "\"%LOCALAPPDATA%\Programs\Python\Python312\python.exe\" app.py"
start "HealthSync Frontend" /D "%PROJECT_ROOT%HealthSync frontend\frontend" cmd /k "npm.cmd run dev"

echo.
echo HealthSync is starting in separate windows.
echo Open http://localhost:5173 after the services finish starting.
endlocal
