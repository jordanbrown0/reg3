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

if exist %dest% (
    if %installmode% == server (
        echo %dest% already exists.
        call Program\lib\confirm "Upgrade instead [y/n]? "
        if errorlevel 1 goto abort
        rmdir /s /q Program\Data
    ) else (
        call Program\lib\confirm "Upgrade %myname% [y/n]? "
        if errorlevel 1 goto abort
    )
) else (
    call Program\lib\confirm "New install of %myname% [y/n]? "
    if errorlevel 1 goto abort
)

if exist %dest% (
    echo Upgrading %myname%...
    :: First, delete the old stuff.
    for %%i in (imported static server src node_modules lib install ReleaseInfo) do (
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
        if errorlevel 1 goto abort
    )

    mkdir %dest%
    if errorlevel 1 (
        echo Bad directory name %myname%.
        goto :abort
    )
)


if not exist %parent%\%NODE% (
    %z% x -o%parent% %NODE%.7z > nul
)
erase %NODE%.7z

xcopy /q /e . %dest%

cd %dest%

cscript /Nologo Program\lib\mkServerShortcut.js %myname%

call Program\lib\ClientWad > nul

echo %dest% is ready.
goto done

:abort
echo Aborted.

:done
pause