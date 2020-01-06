@echo off
setlocal

call Program\lib\NodeVer

set parent=%HOMEDRIVE%%HOMEPATH%\Documents\Reg3
set z=Program\imported\7za

call myname
erase myname.bat
set dest=%parent%\%myname%

if exist %dest% (
	echo %dest% already exists on this system, aborting.
	pause
	goto :EOF
)

if not exist %parent% mkdir %parent%

if not exist %parent%\%NODE% (
    %z% x -o%parent% %NODE%.7z
)
erase %NODE%.7z

mkdir %dest%

xcopy /e . %dest%

echo %dest% is ready.
pause