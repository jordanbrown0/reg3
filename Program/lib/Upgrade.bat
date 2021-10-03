@echo off
setlocal

call Program\lib\FolderPath Personal DOCUMENTS
set parent=%DOCUMENTS%\Reg3

call myname
erase myname.bat
set dest=%parent%\%myname%

if not exist %dest% (
	echo %dest% does not exist on this system, aborting.
	goto :done
)

:: First, delete the old stuff.
for %%i in (imported static server src node_modules lib) do (
    rmdir /s /q %dest%\Program\%%i
)
rmdir /s /q %dest%\Documentation
erase %dest%\Program\*.bat
erase %dest%\*.bat
erase %dest%\README.txt
erase %dest%\COPYRIGHT.txt
erase %dest%\Program\package.json
erase %dest%\Program\package-lock.json

xcopy /q /e . %dest%

cd %dest%

cscript /Nologo Program\lib\mkServerShortcut.js %myname%
call ClientWad

echo %dest% is ready.

:done
pause
