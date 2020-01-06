setlocal

call Program\lib\NodeVer

set dest=%HOMEDRIVE%%HOMEPATH%\Documents\Reg3
set z=Program\imported\7za

if not exist %dest% mkdir %dest%

call myname
erase myname.bat
if exist %dest%\%myname% (
	echo %myname% already exists on this system, aborting.
	pause
	goto :EOF
)

if not exist %dest%\%NODE% (
    %z% x -o%dest% %NODE%.7z
)
erase %NODE%.7z

mkdir %dest%\%myname%

xcopy /e . %dest%\%myname%

echo %myname% is now ready.
pause