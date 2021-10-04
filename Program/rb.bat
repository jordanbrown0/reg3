@echo off
setlocal

set SAVECD=%CD%

:: Get us to the Program directory.
%~d0
cd %~p0

call lib\nodever
copy src\drawer.cc node_modules\myclinic-drawer-printer\drawer.cc /y
copy src\binding.gyp node_modules\myclinic-drawer-printer\binding.gyp /y
set SAVEPATH=%PATH%
PATH %PATH%;%NODEDIR%
call npm rb myclinic-drawer-printer
PATH %SAVEPATH%

cd %SAVECD%