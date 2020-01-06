:: Build a self-extracting wad that clones this convention to use to set up
:: a new server.

setlocal

set dir=%CD%

:: Get us to the top of the convention directory.
%~d0
cd %~p0

for /f %%F in ('call Program\lib\basename %CD%') do (
	set myname=%%F
)

echo myname=%myname%
pause

set outz=%dir%\%myname%.7z
if exist %outz% (
	erase %outz%
)

set outexe=%dir%\%myname%.exe
if exist %outexe% (
	erase %outexe%
)

set z=Program\imported\7za

call Program\lib\mkwad %outz% program data node
echo set myname=%myname% > myname.bat
%z% a %outz% myname.bat
erase myname.bat

copy /b Program\imported\7zSD-noadmin.sfx + Program\lib\NewServer.cfg + %outz% %outexe%
erase %outz%
