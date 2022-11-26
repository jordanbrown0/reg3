:: This runs on the client to be set up.
@echo off

call Program\lib\FolderPath Personal DOCUMENTS
set parent=%DOCUMENTS%\Reg3

if not exist %parent% (
    mkdir %parent%
    if errorlevel 1 (
        echo mkdir %parent% failed, aborting.
        goto done
    )
)

if exist %parent%\Reg.ico (
    erase %parent%\Reg.ico
)

copy Program\static\Reg.ico %parent%\Reg.ico > nul

set ff=%parent%\Firefox
if not exist %ff% (
    mkdir %ff%
    if errorlevel 1 (
        echo mkdir %ff% failed, aborting.
        goto done
    )
)

copy Program\lib\user.js %ff% > nul
if errorlevel 1 (
    echo copying user.js to %ff% failed, aborting.
    goto done
)

call servername
erase servername.bat
cscript /Nologo Program\lib\mkClientShortcut.js %servername%
echo Client shortcuts installed.
:done
pause
