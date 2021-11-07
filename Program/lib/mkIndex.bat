@echo off
:: Read all of the top-level HTML files in Documentation and construct an
:: index in Built/IndexEntries.html.
:: This batch file lives in Program\lib.
setlocal

set SAVECD=%CD%

:: Get us to the top of the Documentation directory.
%~d0
cd %~p0\..\..\Documentation

call ..\Program\lib\NodeVer

%NODEDIR%\node.exe ..\Program\lib\mkIndex.js

:done
cd %SAVECD%
