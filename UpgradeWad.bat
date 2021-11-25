:: Build a self-extracting wad that upgrades an existing convention.
@echo off
setlocal

set dir=%CD%

:: Get us to the top of the convention directory.
%~d0
cd %~p0

call ReleaseInfo\Release.bat
set myname=Reg3upgrade-%token%

set outz=%dir%\%myname%.7z
if exist %outz% (
	erase %outz%
)

set outexe=%dir%\%myname%.exe
if exist %outexe% (
	erase %outexe%
)

set z=Program\imported\7za

call Program\lib\mkwad %outz% program node

echo set /p myname=Convention directory? > myname.bat
%z% a %outz% myname.bat > nul
erase myname.bat

echo ;!@Install@!UTF-8!                                              > tmp.cfg
echo Title="Reg3"                                                    >> tmp.cfg
echo BeginPrompt="Do you want to upgrade Reg3 on an existing convention?" >> tmp.cfg
echo RunProgram="Program\lib\Upgrade.bat"                            >> tmp.cfg
echo ;!@InstallEnd@!                                                 >> tmp.cfg

copy /b Program\imported\7zSD-noadmin.sfx + tmp.cfg + %outz% %outexe% > nul
erase tmp.cfg
erase %outz%

echo %outexe% is ready.
