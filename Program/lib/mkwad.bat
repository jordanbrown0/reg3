:: Make a 7z wad containing the specified content.
:: This batch file lives in Program\lib.
setlocal

set SAVECD=%CD%

if "%1" == "" goto usage
if "%2" == "" goto usage

set out=%~f1

:: Get us to the top of the convention directory.
%~d0
cd %~p0\..\..

shift

if exist %out% (
	erase %out%
)

set z=Program\imported\7za -bsp2

:loop

if "%1" == "" goto done

if "%1" == "program" goto program
if "%1" == "data" goto data
if "%1" == "node" goto node

echo "Unknown thing to put in wad '%1'"
goto done

:program

%z% a %out% Program\imported Program\static Program\server Program\src > nul
%z% a %out% Program\ReleaseInfo > nul
:: OK, so I'm obsessing.  But these build artifacts total to
:: more than 7MB.

set rel=Program\node_modules\myclinic-drawer-printer\build\Release
%z% a %out% Program\node_modules -x!%rel%\*.pdb -x!%rel%\obj\drawer\*.obj -x!%rel%\*.iobj -x!%rel%\*.map > nul

%z% a %out% *.bat Program\lib Program\*.bat > nul
%z% a %out% README.md COPYRIGHT.txt Documentation > nul
%z% a %out% Program\package.json Program\package-lock.json > nul
:: Include the data directory, but not the contents.
%z% a %out% Program\data -x!Program\data\* > nul
goto next

:data

: Note that we do not want to pick up data\serverID.json because we are
: presumably making this wad to install another server.
%z% a %out% Program\data -x!Program\data\serverID.json > nul
goto next

:node

call Program\lib\NodeVer

if exist %NODE%.7z (
    erase %NODE%.7z
)

:: The only thing in the default global node_modules is npm, and
:: that totals to nearly 20MB.  A developer wad would need it, but
:: a production wad doesn't.
%z% a %NODE%.7z %NODEDIR% -x!%NODE%\node_modules -x!%NODE%\npm -x!%NODE%\npm.cmd -x!%NODE%\npx -x!%NODE%\npx.cmd > nul

%z% a %out% %NODE%.7z > nul

erase %NODE%.7z

goto next

:next
shift
goto loop

:usage
echo "Usage:  new <wad>.7z { program | data | node } ..."
:done
cd %SAVECD%
