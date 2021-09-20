@echo off
setlocal

if "%2" == "" (
    echo Usage: %~f0 destdir dirname
	goto :EOF
)

set dest=%1
set myname=%2

call Program\lib\FolderPath Desktop DESKTOP

set bat=%DESKTOP%\%myname% Registration Server.bat
echo @echo off             > "%bat%"
echo call %dest%\Server    >> "%bat%"
echo if errorlevel 1 pause >> "%bat%"
