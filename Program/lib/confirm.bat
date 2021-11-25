:: Ask a question, get a yes/no response
@echo off

setlocal
:again
set /p answer=%1
if /I "%answer%" equ "y" (
    exit /b 0
)
if /I "%answer%" equ "yes" (
    exit /b 0
)
if /I "%answer%" equ "n" (
    exit /b 1
)
if /I "%answer%" equ "no" (
    exit /b 1
)
echo Enter yes, no, y, or n.
goto again
