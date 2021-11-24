:: Start server.
@echo off
setlocal
:: Get us to the top of the convention directory.
:: Do this outside the setlocal so that we end up there.
%~d0
cd %~p0
call Program\lib\nodever
PATH %PATH%;%NODEDIR%
cd Program
node server\reg.js
if errorlevel 1 (
    pause
)
