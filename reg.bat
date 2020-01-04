@echo off
call nodever
set SAVEPATH=%PATH%
PATH %PATH%;%NODEDIR%
node server\reg.js
PATH %SAVEPATH%
