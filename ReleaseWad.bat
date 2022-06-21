@echo off
setlocal

rem Confirm that everything is checked in before we create a release.
set ok=yes
for /f %%i in ('git status --porcelain') do (
    set ok=no
)
if %ok% == no (
    echo Everything must be checked in.
    git status --short
    goto :EOF
)

rem date format: Wed 11/24/2021
rem time format:  7:59:49.92
set datestamp=%DATE:~-4,4%-%DATE:~-10,2%-%DATE:~-7,2%
set h=%TIME:~0,2%
set h=%h: =%
set h=0%h%
set h=%h:~-2,2%
set m=%TIME:~3,2%
set s=%TIME:~6,2%
set timestamp=%h%:%m%:%s%
set token=%datestamp%.%h%.%m%.%s%
set release=%datestamp% %timestamp%

:: Get us to the top of the convention directory.
%~d0
cd %~p0

set rib=Program\ReleaseInfo\Release.bat
set rij=Program\ReleaseInfo\Release.js

rem Note that there must not be any space before the ">" because it will go
rem into the file and thence into the variable values.
echo set token=%token%> %rib%
echo set release=%release%>> %rib%
git add %rib%

echo var Release={ name: '%release%' };> %rij%
echo export { Release };>> %rij%
git add %rij%

git commit -m "Release %release%" > nul
git tag -a -m "%release%" %token%
call InstallWad
git push
git push --tags
