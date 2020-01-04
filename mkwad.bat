call nodevar

erase wad.7z
erase %NODE%.7z

7za a %NODE%.7z %NODEDIR%

7za a wad.7z %NODE%.7z
7za a wad.7z 7za.exe 7zSD-noadmin.sfx
7za a wad.7z static
7za a wad.7z server
7za a wad.7z drawer.cc node_modules
7za a wad.7z *.bat *.txt
7za a wad.7z package.json package-lock.json

copy /b 7zSD-noadmin.sfx + selfextract.cfg + wad.7z wad.exe
