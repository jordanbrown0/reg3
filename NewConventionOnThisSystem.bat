:: Make a new convention on this system.
@echo off
setlocal

:: Get us to the top of the convention directory.
%~d0
cd %~p0

set /p myname=Directory for new convention?

call Program\lib\FolderPath Personal DOCUMENTS
set parent=%DOCUMENTS%\Reg3
set dest=%parent%\%myname%

if exist "%dest%" (
	echo %dest% already exists
	goto :EOF
)

set z=%CD%\Program\imported\7za

call Program\lib\mkwad %myname%.7z program

mkdir %dest%
if errorlevel 1 (
	echo Bad directory name %myname%, aborting.
	goto :EOF
)

%z% x -o%dest% %myname%.7z > nul
erase %myname%.7z
call Program\lib\mkbat %dest% %myname%

echo %dest% is ready.

goto :EOF
