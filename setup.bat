dir
call nodever

set dest=%HOMEDRIVE%%HOMEPATH%\Documents\Reg3

if not exist %dest% mkdir %dest%

if not exist %dest%\%NODE% (
    7za x -o%dest% %NODE%.7z
)
erase %NODE%.7z

mkdir %dest%\New

xcopy /e . %dest%\New

mkdir %dest%\New\data

pause