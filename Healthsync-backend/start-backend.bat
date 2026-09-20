@echo off
echo ========================================================
echo Starting HealthSync Microservices Backend...
echo ========================================================

echo [1/3] Starting API Gateway on Port 8081...
start "HealthSync API Gateway" /D gateway cmd.exe /k "node index.js"

echo [2/3] Starting User Service (Spring Boot) on Port 8082...
start "HealthSync User Service" /D user-service cmd.exe /k "mvnw.cmd spring-boot:run"

echo [3/3] Starting Health Service (Spring Boot) on Port 8083...
start "HealthSync Health Service" /D health-service cmd.exe /k "mvnw.cmd spring-boot:run"

echo ========================================================
echo All backend microservices have been launched in separate windows!
echo - API Gateway: http://localhost:8081
echo - User Service: http://localhost:8082
echo - Health Service: http://localhost:8083
echo - H2 Database Console: http://localhost:8082/h2-console
echo ========================================================
pause
