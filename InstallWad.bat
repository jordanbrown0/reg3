:: Build a self-extracting wad that installs a new convention or upgrades an
:: existing convention.
@echo off
setlocal

set dir=%CD%

:: Get us to the top of the convention directory.
%~d0
cd %~p0

call Program\ReleaseInfo\Release.bat
set myname=Reg3-%token%

set outz=%dir%\%myname%.7z
if exist %outz% (
	erase %outz%
)

set outexe=%dir%\%myname%.exe
if exist %outexe% (
	erase %outexe%
)

set z=Program\imported\7za -bsp2

call Program\lib\mkwad %outz% program node

echo set installmode=any> installmode.bat
%z% a %outz% installmode.bat > nul
erase installmode.bat

echo ;!@Install@!UTF-8!                                              > tmp.cfg
echo Title="Reg3"                                                    >> tmp.cfg
echo BeginPrompt="Install/upgrade Reg3?"                             >> tmp.cfg
echo RunProgram="Program\lib\Setup.bat"                              >> tmp.cfg
echo ;!@InstallEnd@!                                                 >> tmp.cfg

copy /b Program\imported\7zSD-noadmin.sfx + tmp.cfg + %outz% %outexe% > nul
erase tmp.cfg
erase %outz%

echo %outexe% is ready.
