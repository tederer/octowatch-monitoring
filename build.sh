#!/bin/bash

scriptDir=$(cd $(dirname $0) && pwd)
cd $scriptDir

if [ ! -e ./node_modules ]; then
   echo "Installing dependencies ..."
   npm install
fi

npm run build 

