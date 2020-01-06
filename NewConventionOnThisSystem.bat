:: Make a new convention on this system.
@echo off
setlocal

:: Get us to the top of the convention directory.
%~d0
cd %~p0

set /p myname=Directory for new convention?

call :getparent %CD%
set dest=%parent%%myname%

if exist "%dest%" (
	echo %dest% already exists
	goto :EOF
)

set z=%CD%\Program\imported\7za

call Program\lib\mkwad %myname%.7z program

mkdir %dest%
%z% x -o%dest% %myname%.7z
erase %myname%.7z
call Program\lib\mkbat %dest% %myname%

echo %dest% is ready.

goto :EOF

:getparent
set parent=%~dp1
goto :EOF
