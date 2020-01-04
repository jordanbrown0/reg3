call nodever
rmdir %NODEDIR% /s
powershell -Command "$client = new-object System.Net.WebClient; $client.DownloadFile('https://nodejs.org/dist/%NODEVER%/%NODE%.zip','%NODEDIR%.zip')"

:: PowerShell can expand ZIP archives, but 7-Zip is much faster and we need
:: it to create self-extracting archives anyway.
:: ; Expand-Archive -Path %NODE%.zip -DestinationPath ."

7za x -o.. %NODEDIR%.zip

rmdir node_modules /s /q
set SAVEPATH=%PATH%
PATH %PATH%;%NODEDIR%
call npm install
PATH %SAVEPATH%

call rb
