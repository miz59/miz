@ECHO OFF
COLOR 0A
SET LOCATION=%~dp0
TITLE INSTALL-miz

:::  _____                                      _____ 
::: ( ___ )                                    ( ___ )
:::  |   |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|   | 
:::  |   |                                      |   | 
:::  |   |       __    __   __   ______         |   | 
:::  |   |      /\ "-./  \ /\ \ /\___  \        |   | 
:::  |   |      \ \ \-./\ \\ \ \\/_/  /__       |   | 
:::  |   |       \ \_\ \ \_\\ \_\ /\_____\      |   | 
:::  |   |        \/_/  \/_/ \/_/ \/_____/      |   | 
:::  |   |                                      |   | 
:::  |___|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|___| 
::: (_____)                                    (_____)

for /f "delims=: tokens=*" %%A in ('findstr /b ::: "%~f0"') do @echo(%%A

set package_name=npm
:loop
call npm -v %package_name% >nul 2>nul
@ECHO OFF
COLOR 0A
TITLE INSTALL-miz
if %errorlevel% equ 0 (
    echo %package_name% is install
) else (
    ECHO %package_name% is not install ! You can download it from https://nodejs.org/en/download
    set /p user_input="Do you want checking again (Y/N): "
    if /i "%user_input%"=="N" (
        goto :eof
    ) else if /i "%user_input%"=="Y" (
        goto loop
    ) else (
        echo Please use Y or N
        goto loop
    )
)
ECHO Where do you want to set your path assets folder ?
SET /P PASTE=
SET COPY=%LOCATION%\assets
ECHO %COPY%
ECHO "%PASTE%"assets
XCOPY /E /I %COPY% "%PASTE%"assets
RMDIR /s /q %LOCATION%assets
if %errorlevel% equ 0 (
    @REM not thing
) else (
    PAUSE
    exit
)
ECHO where is your html file ?
SET /P HTML=

echo { >> "%HTML%\package.json"
echo     "name": "restaurant-sass", >> "%HTML%\package.json"
echo     "version": "1.0.0", >> "%HTML%\package.json"
echo     "description": "nadarim", >> "%HTML%\package.json"
echo     "scripts": { >> "%HTML%\package.json"
echo       "watch": "sass --watch --update --style=expanded sass/style.scss:assets/css/style.css", >> "%HTML%\package.json"
echo       "build": "sass --no-source-map --style=compressed sass/style.scss:assets/css/style.min.css" >> "%HTML%\package.json"
echo     }, >> "%HTML%\package.json"
echo     "author": "", >> "%HTML%\package.json"
echo     "license": "ISC", >> "%HTML%\package.json"
echo     "devDependencies": { >> "%HTML%\package.json"
echo       "sass": "^1.75.0" >> "%HTML%\package.json"
echo     } >> "%HTML%\package.json"
echo } >> "%HTML%\package.json"

SET LOCATION-JSON=%~dp0
call npm install
@ECHO OFF
COLOR 0A
TITLE INSTALL-miz
ECHO what is name html ?
SET /P HTML-NAME=
CD %HTML%
IF EXIST %HTML-NAME%.html (
    DEL /s /q %HTML-NAME%.html
) ELSE (
    @REM not thing
)

if %HTML% equ %PASTE% (
    ECHO ^<html^>>> %HTML-NAME%.html
    ECHO     ^<head^>>> %HTML-NAME%.html
    ECHO         ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>>> %HTML-NAME%.html
    ECHO         ^<link rel="stylesheet" href="./assets/css/style.css"^>>> %HTML-NAME%.html
    ECHO     ^</head^>>> %HTML-NAME%.html
    ECHO     ^<body^>>> %HTML-NAME%.html
    ECHO     ^</body^>>> %HTML-NAME%.html
    ECHO ^</html^>>> %HTML-NAME%.html
) else (
    ECHO ^<html^>>> %HTML-NAME%.html
    ECHO     ^<head^>>> %HTML-NAME%.html
    ECHO         ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>>> %HTML-NAME%.html
    ECHO         ^<link rel="stylesheet" href=""^>>> %HTML-NAME%.html
    ECHO     ^</head^>>> %HTML-NAME%.html
    ECHO     ^<body^>>> %HTML-NAME%.html
    ECHO     ^</body^>>> %HTML-NAME%.html
    ECHO ^</html^>>> %HTML-NAME%.html
)
CD %LOCATION%
DEl /s /q *.bat

PAUSE