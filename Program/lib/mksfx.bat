: The standard version of 7xSD.sfx requests administrator rights
: on startup, whether or not it really needs them.
: This batch file modifies it so that it does not.
: Derived from https://stackoverflow.com/a/54212524/1196010
: I don't know where C:\Program Files (x86)\Windows Kits came from.
: I did find several copies of mt.exe in various MS / Windows directories
: in C:\Program Files (x86).

copy 7zSD.sfx 7zSD-noadmin.sfx

"C:\Program Files (x86)\Windows Kits\8.1\bin\x86\mt.exe" -manifest sfx-manifest.xml -outputresource:"7zSD-noadmin.sfx;#1"