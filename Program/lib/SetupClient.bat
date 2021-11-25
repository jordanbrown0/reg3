:: This runs on the client to be set up.
@echo off

call Program\lib\FolderPath Personal DOCUMENTS
set parent=%DOCUMENTS%\Reg3

if not exist %parent% (
	mkdir %parent%
	if errorlevel 1 (
		echo Aborting.
		goto :done
	)
)

if exist %parent%\Reg.ico (
    erase %parent%\Reg.ico
)

copy Program\static\Reg.ico %parent%\Reg.ico > nul

call servername
erase servername.bat
cscript /Nologo Program\lib\mkClientShortcut.js %servername%
echo Client shortcuts installed.
pause
