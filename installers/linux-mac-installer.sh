#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

LOCATION_INSTALLER=$(dirname "$1")
LOCATION_MIZ=$(dirname "$LOCATION_INSTALLER")
LOCATION_SASS=$(dirname "$LOCATION_MIZ")

echo -e "${GREEN}INSTALL-miz${NC}"
###  _____                                      _____ 
### ( ___ )                                    ( ___ )
###  |   |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|   | 
###  |   |                                      |   | 
###  |   |       __    __   __   ______         |   | 
###  |   |      /\ "-./  \ /\ \ /\___  \        |   | 
###  |   |      \ \ \-./\ \\ \ \\/_/  /__       |   | 
###  |   |       \ \_\ \ \_\\ \_\ /\_____\      |   | 
###  |   |        \/_/  \/_/ \/_/ \/_____/      |   | 
###  |   |                                      |   | 
###  |___|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|___| 
### (_____)                                    (_____)
grep '^###' "$0" | sed 's/^###//' | sed 's/^/\x1b[32m/'

package_name="npm"
while true; do
    npm -v $package_name >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "$package_name is installed."
        break
    else
        echo -e "${RED}$package_name is not installed. You can download it from https://nodejs.org/en/download${NC}"
        read -p "Do you want to check again (Y/N): " user_input
        if [[ "$user_input" == "N" ]]; then
            exit
        elif [[ "$user_input" == "Y" ]]; then
            continue
        else
            echo "Please use Y or N"
            continue
        fi
    fi
done

cd ..
echo "Where do you want to set your path assets folder?"
read PASTE
COPY="$LOCATION_MIZ/assets"
echo "$COPY"
echo "$PASTE"assets
cp -r $COPY "$PASTE"assets
rm -rf $LOCATION_MIZ/assets

echo "Where is your html file?"
read HTML

echo '{
    "name": "restaurant-sass",
    "version": "1.0.0",
    "description": "nadarim",
    "scripts": {
      "watch": "sass --watch --update --style=expanded sass/style.scss:assets/css/style.css",
      "build": "sass --no-source-map --style=compressed sass/style.scss:assets/css/style.min.css"
    },
    "author": "",
    "license": "ISC",
    "devDependencies": {
      "sass": "^1.75.0"
    }
}' > "$HTML/package.json"

cd ..
if [ -f "$LOCATION_SASS/style.scss" ]; then
    rm "$LOCATION_SASS/style.scss"
fi

if [ -f "$LOCATION_SASS/pages/_index.scss" ]; then
    rm "$LOCATION_SASS/pages/_index.scss"
fi
echo '@import "./miz";' >> "$LOCATION_SASS/style.scss"
echo '@import "./components";' >> "$LOCATION_SASS/style.scss"
echo '@import "./layout";' >> "$LOCATION_SASS/style.scss"
echo '@import "./pages";' >> "$LOCATION_SASS/style.scss"
echo '' >> "$LOCATION_SASS/_layout.scss"
echo '' >> "$LOCATION_SASS/_components.scss"
mkdir -p "$LOCATION_SASS/pages"
echo '@import "./home";' >> "$LOCATION_SASS/pages/_index.scss"
echo '' >> "$LOCATION_SASS/pages/_home.scss"
cd $LOCATION_MIZ

npm install

echo "What is the name of the html?"
read HTML_NAME
cd $HTML
if [ -f "$HTML_NAME.html" ]; then
    rm "$HTML_NAME.html"
fi

if [ "$HTML" == "$PASTE" ]; then
    cat << EOF > "$HTML_NAME.html"
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="./assets/css/style.css">
    </head>
    <body>
    </body>
</html>
EOF
else
    cat << EOF > "$HTML_NAME.html"
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="">
    </head>
    <body>
    </body>
</html>
EOF
fi

cd $LOCATION_MIZ
rm -rf installer

echo "Press any key to exit..."
read -n 1 -s