#!/bin/sh

# Copyright (C) 2026 Johannes Endres
#
# SPDX-License-Identifier: MIT

VERSION=$1
if [ -z "${VERSION}" ]; then 
    VERSION='latest'
fi

PORT=9201

docker volume rm ocis-config
docker volume rm ocis-data

docker volume create ocis-config
docker volume create ocis-data

docker pull owncloud/ocis:${VERSION}
docker run --rm -it \
    -v ocis-config:/etc/ocis \
    -e IDM_ADMIN_PASSWORD=Password+123 \
    owncloud/ocis:${VERSION} init --force-overwrite

docker run \
    --name ocis \
    --rm \
    -d \
    -p ${PORT}:${PORT} \
    -v ocis-config:/etc/ocis \
    -v ocis-data:/var/lib/ocis \
    -e OCIS_INSECURE=true \
    -e OCIS_URL=https://localhost:${PORT} \
    -e PROXY_HTTP_ADDR=0.0.0.0:${PORT} \
    -e PROXY_ENABLE_BASIC_AUTH=true \
    owncloud/ocis:${VERSION}

cat  << EOL

ownCloud Infinite Scale ${VERSION} started at https://localhost:${PORT}

Now
* Remove all files
* Set the admin account's quota to 10 MB
* Add a certificate exception in your Thunderbird test profile
EOL