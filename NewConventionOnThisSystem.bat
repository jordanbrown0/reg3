:: Make a new convention on this system, and changes directory to it.
:: NewConventionOnThisSystem <name>
@echo off

if "%1" == "" (
	echo "Usage:  NewConventionOnThisSystem name"
	goto :EOF
)

if exist "%~dp0\..\%1" (
	echo %1 already exists
	goto :EOF
)

:: Get us to the top of the convention directory.
:: Do this outside the setlocal so that we end up there.
%~d0
cd %~p0

setlocal

set name=%1

set z=%CD%\Program\imported\7za

call Program\lib\mkwad new.7z program

mkdir ..\%name%
%z% x -o..\%name% new.7z
erase new.7z

endlocal

cd ..\%1
echo %CD% is ready.
