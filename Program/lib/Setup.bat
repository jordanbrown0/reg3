@echo off
setlocal
SETLOCAL ENABLEDELAYEDEXPANSION

call Program\lib\NodeVer

call Program\lib\FolderPath Personal DOCUMENTS
set parent=%DOCUMENTS%\Reg3
set z=Program\imported\7za

call installmode
erase installmode.bat
if %installmode% == any (
    set /p myname=Convention directory?
)

set dest=%parent%\%myname%
if %installmode% == server (
    if exist %dest% (
        echo %dest% already exists.
        set /p ans=Upgrade instead [y/n]?
        if "!ans!" == "y" (
            rmdir /s /q Program\Data
        ) else (
            echo Aborting...
            goto done
        )
    )
)

if exist %dest% (
    echo Upgrading %myname%...
    :: First, delete the old stuff.
    for %%i in (imported static server src node_modules lib install) do (
        rmdir /s /q %dest%\Program\%%i
    )
    rmdir /s /q %dest%\Documentation
    erase %dest%\Program\*.bat
    erase %dest%\*.bat
    erase %dest%\README.txt
    erase %dest%\COPYRIGHT.txt
    erase %dest%\Program\package.json
    erase %dest%\Program\package-lock.json
) else (
    echo Installing %myname%...
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
)


if not exist %parent%\%NODE% (
    %z% x -o%parent% %NODE%.7z > nul
)
erase %NODE%.7z

xcopy /q /e . %dest% > nul

cd %dest%

cscript /Nologo Program\lib\mkServerShortcut.js %myname%

call Program\lib\ClientWad > nul

echo %dest% is ready.

:done
pause