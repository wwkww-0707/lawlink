@echo off
rem LawLink deploy starter (Windows)
cd /d %~dp0
echo Starting LawLink server on port 8080 ...
node server.js
pause
