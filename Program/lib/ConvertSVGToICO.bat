@echo off
if "%1" == "" goto usage
if not exist %1.svg goto usage

magick -background transparent %1.svg -compress Zip -density 256x256 -define icon:auto-resize="64,48,32,16" -colors 256 %1.ico 

REM Haven't been able to figure out how to do this next in ImageMagick.
echo Now load it into GIMP and export, 8-bit, compressed.
goto :EOF

:usage
echo Usage: ConvertSVGToICO name
echo with no extension.
