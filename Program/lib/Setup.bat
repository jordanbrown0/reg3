@echo off
setlocal

call Program\lib\NodeVer

call Program\lib\FolderPath Personal DOCUMENTS
set parent=%DOCUMENTS%\Reg3
set z=Program\imported\7za

call myname
erase myname.bat
set dest=%parent%\%myname%

if exist %dest% (
	echo %dest% already exists on this system, aborting.
	goto :done
)

if not exist %parent% (
	mkdir %parent%
	if errorlevel 1 (
		echo Aborting.
		goto :done
	)
)

mkdir %dest%
if errorlevel 1 (
	echo Bad directory name %myname%, aborting.
	goto :done
)

if not exist %parent%\%NODE% (
    %z% x -o%parent% %NODE%.7z
)
erase %NODE%.7z

xcopy /e . %dest%

cd %dest%

cscript /Nologo Program\lib\mkServerShortcut.js %myname%

call ClientWad


echo %dest% is ready.

:done
pause