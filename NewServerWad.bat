:: Build a self-extracting wad that clones this convention to use to set up
:: a new server.
@echo off
setlocal

set dir=%CD%

:: Get us to the top of the convention directory.
%~d0
cd %~p0

for /f %%F in ('call Program\lib\basename %CD%') do (
	set myname=%%F
)

set outz=%dir%\%myname%.7z
if exist %outz% (
	erase %outz%
)

set outexe=%dir%\%myname%.exe
if exist %outexe% (
	erase %outexe%
)

set z=Program\imported\7za -bsp2

call Program\lib\mkwad %outz% program data node

echo set installmode=server> installmode.bat
echo set myname=%myname%>> installmode.bat
%z% a %outz% installmode.bat > nul
erase installmode.bat

echo ;!@Install@!UTF-8!                                              > tmp.cfg
echo Title="Reg3"                                                    >> tmp.cfg
echo BeginPrompt="Install a new Reg3 server for %myname%?"           >> tmp.cfg
echo RunProgram="Program\lib\Setup.bat"                              >> tmp.cfg
echo ;!@InstallEnd@!                                                 >> tmp.cfg

copy /b Program\imported\7zSD-noadmin.sfx + tmp.cfg + %outz% %outexe% > nul
erase tmp.cfg
erase %outz%

echo %outexe% is ready.
