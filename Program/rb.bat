call nodever
copy drawer.cc node_modules\myclinic-drawer-printer\drawer.cc /y
set SAVEPATH=%PATH%
PATH %PATH%;%NODEDIR%
call npm rb myclinic-drawer-printer
PATH %SAVEPATH%
