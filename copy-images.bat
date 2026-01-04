@echo off
echo Copying images...
if not exist "public\images" mkdir "public\images"
xcopy /E /I /Y "C:\Users\User\Downloads\saveweb2zip-com-elevateballers-com\images\*" "public\images\"
echo Images copied successfully!
pause

