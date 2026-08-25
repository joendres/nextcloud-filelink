#!/bin/sh

# Copyright (C) 2026 Johannes Endres
#
# SPDX-License-Identifier: MIT

VERSION=$1
if [ -z "${VERSION}" ]; then 
    VERSION='latest'
fi

PORT=8080

docker pull nextcloud:${VERSION}
docker run --rm \
    -d \
    -p ${PORT}:80 \
    --name nextcloud \
    nextcloud:${VERSION}

cat << EOL

Nextcloud ${VERSION} started at http://localhost:${PORT}/

Please
* Complete the installation with username admin and password Password+123
* Remove all files
* Set the admin account's quota to 10 MB
EOL
