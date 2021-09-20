@echo off
:: Usage:
:: FolderPath <name> <var>
:: e.g. FolderPath Desktop DESKTOP
:: yields %DESKTOP%.
::
:: A few possibly useful names:
:: Desktop
:: Personal - the Documents folder
:: Startup
:: {374DE290-123F-4565-9164-39C4925E467B} - Downloads
:: Start Menu - but it doesn't work because of the space

for /f "usebackq tokens=1,2,*" %%B IN (`reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" /v %1`) do echo set %2=%%D> %TEMP%\FolderPath2.bat
call %TEMP%\FolderPath2.bat
erase %TEMP%\FolderPath2.bat
