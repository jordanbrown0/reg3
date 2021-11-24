rem date format: Wed 11/24/2021
rem time format:  7:59:49.92
setlocal

set ok=yes
for /f %%i in ('git status --porcelain') do (
    set ok=no
)
if %ok% == no (
    echo Everything must be checked in.
    git status --short
    goto :EOF
)

set datestamp=%DATE:~-4,4%-%DATE:~-10,2%-%DATE:~-7,2%
set h=%TIME:~0,2%
set h=%h: =%
set h=0%h%
set h=%h:~-2,2%
set m=%TIME:~3,2%
set s=%TIME:~6,2%
set timestamp=%h%:%m%:%s%
set filename=%datestamp%.%h%.%m%.%s%
set release=%datestamp% %timestamp%

:: Get us to the top of the convention directory.
%~d0
cd %~p0

echo set filename=%filename% > ReleaseInfo/release.bat
echo set release=%release% >> ReleaseInfo/release.bat
echo var release='%release%'; > ReleaseInfo/release.js
git tag -a -m "%release%"
