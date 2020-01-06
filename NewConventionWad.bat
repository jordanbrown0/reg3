:: Build a self-extracting wad that sets up a new convention.
setlocal

set outz=%CD%\NewConvention.7z
if exist %outz% (
	erase %outz%
)

set outexe=%CD%\NewConvention.exe
if exist %outexe% (
	erase %outexe%
)

:: Get us to the top of the convention directory.
%~d0
cd %~p0

call Program\lib\mkwad %outz% program data node

copy /b Program\imported\7zSD-noadmin.sfx + Program\lib\NewConvention.cfg + %outz% %outexe%
erase %outz%
