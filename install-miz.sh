#!/bin/bash

LOCATION=$(dirname "$0")

echo -e "\033]0;INSTALL-miz\007"
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
    if npm -v $package_name >/dev/null 2>&1; then
        echo "$package_name is install"
        break
    else
        echo "$package_name is not install ! You can download it from https://nodejs.org/en/download"
        read -p "Do you want checking again (Y/N): " user_input
        if [[ "$user_input" == "N" ]]; then
            exit
        elif [[ "$user_input" == "Y" ]]; then
            continue
        else
            echo "Please use Y or N"
        fi
    fi
done

read -p "Where do you want to set your path assets folder ? " PASTE
COPY="$LOCATION/assets"
echo "$COPY"
echo "$PASTE"assets
cp -r "$COPY" "$PASTE"assets
rm -rf "$LOCATION/assets"

read -p "where is your html file ?" HTML

cat > "$HTML/package.json" << EOL
{
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
}
EOL

npm install

read -p "what is name html ?" HTML_NAME

cd "$HTML"
if [[ -f "$HTML_NAME.html" ]]; then
    rm "$HTML_NAME.html"
fi

cat > "$HTML_NAME.html" << EOL
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="./assets/css/style.css">
    </head>
    <body>
    </body>
</html>
EOL
cd "$LOCATION"
rm "$0"

read -p "Press enter to continue..."