setlocal

call Program\lib\NodeVer

set dest=%HOMEDRIVE%%HOMEPATH%\Documents\Reg3
set z=Program\imported\7za

if not exist %dest% mkdir %dest%

if not exist %dest%\%NODE% (
    %z% x -o%dest% %NODE%.7z
)
erase %NODE%.7z
pause

mkdir %dest%\New

xcopy /e . %dest%\New

pause