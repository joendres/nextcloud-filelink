#!/bin/sh

# Copyright (C) 2026 Johannes Endres
#
# SPDX-License-Identifier: MIT

VERSION=$1
if [ -z "${VERSION}" ]; then 
    VERSION='latest'
fi

PORT=8081

docker pull owncloud/server:${VERSION}
docker run \
    --rm \
    -d \
    -p ${PORT}:8080 \
    --name owncloud \
    -e OWNCLOUD_ADMIN_USERNAME=admin \
    -e OWNCLOUD_ADMIN_PASSWORD=Password+123 \
    owncloud/server:${VERSION}

cat << EOL

ownCloud Classic ${VERSION} started at http://localhost:${PORT}/

Please
* Remove all files
* Set the admin account's quota to 10 MB
EOL