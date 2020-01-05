call nodevar

erase wad.7z
erase %NODE%.7z

:: The only thing in the default global node_modules is npm, and
:: that totals to nearly 20MB.  A developer wad would need it, but
:: a production wad doesn't.
7za a %NODE%.7z %NODEDIR% -x!%NODE%\node_modules

7za a wad.7z %NODE%.7z
7za a wad.7z 7za.exe 7zSD-noadmin.sfx
7za a wad.7z static
7za a wad.7z server
:: OK, so I'm obsessing.  But these build artifacts total to
:: more than 7MB.
7za a wad.7z drawer.cc node_modules -x!node_modules\myclinic-drawer-printer\build\Release\*.pdb -x!node_modules\myclinic-drawer-printer\build\Release\obj\drawer\*.obj -x!node_modules\myclinic-drawer-printer\build\Release\*.iobj -x!node_modules\myclinic-drawer-printer\build\Release\*.map
7za a wad.7z *.bat *.txt
7za a wad.7z package.json package-lock.json

copy /b 7zSD-noadmin.sfx + selfextract.cfg + wad.7z wad.exe
