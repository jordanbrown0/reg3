:: Create client install wad.
:: This batch file lives in Program\lib.
:: This is usually executed during server install.
@echo off
setlocal

if "%1" NEQ "" goto usage

set outdir=Program\install
set out=%outdir%\InstallClient
set outz=%out%.7z
set outexe=%out%.exe

:: Get us to the top of the convention directory.
%~d0
cd %~p0\..\..

if exist %outz% (
	erase %outz%
)
if exist %outexe% (
    erase %outexe%
)
if not exist %outdir% (
    mkdir %outdir%
)

set z=Program\imported\7za -bsp2

%z% a %outz% Program\lib\mkClientShortcut.js                        > nul
%z% a %outz% Program\lib\SetupClient.bat                            > nul
%z% a %outz% Program\lib\FolderPath.bat                             > nul
%z% a %outz% Program\static\Reg.ico                                 > nul

echo set servername=%COMPUTERNAME% > servername.bat
%z% a %outz% servername.bat                                         > nul
erase servername.bat

echo ;!@Install@!UTF-8!                                              > tmp.cfg
echo Title="Reg3"                                                    >> tmp.cfg
echo BeginPrompt="Do you want to install Reg3 client support?"       >> tmp.cfg
echo RunProgram="Program\lib\SetupClient.bat"                        >> tmp.cfg
echo ;!@InstallEnd@!                                                 >> tmp.cfg

copy /b Program\imported\7zSD-noadmin.sfx + tmp.cfg + %outz% %outexe% > nul
erase tmp.cfg
erase %outz%

echo %outexe% is ready.

goto :EOF

:usage
echo "Usage:  ClientWad"
