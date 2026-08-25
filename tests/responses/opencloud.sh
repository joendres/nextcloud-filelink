#!/bin/sh

# Copyright (C) 2026 Johannes Endres
#
# SPDX-License-Identifier: MIT

VERSION=$1
if [ -z "${VERSION}" ]; then 
    VERSION='rolling:latest'
fi

PORT=9200

docker pull opencloudeu/opencloud-${VERSION}

docker volume rm opencloud-config
docker volume rm opencloud-data

docker volume create opencloud-config
docker volume create opencloud-data

docker run --rm -it \
    -v opencloud-config:/etc/opencloud \
    -v opencloud-data:/var/lib/opencloud \
    -e IDM_ADMIN_PASSWORD=Password+123 \
    opencloudeu/opencloud-${VERSION} init

docker run \
    --name opencloud \
    --rm \
    -d \
    -p ${PORT}:${PORT} \
    -v opencloud-config:/etc/opencloud \
    -v opencloud-data:/var/lib/opencloud \
    -e OC_INSECURE=true \
    -e OC_URL=https://localhost:${PORT} \
    -e PROXY_HTTP_ADDR=0.0.0.0:${PORT} \
    -e PROXY_ENABLE_BASIC_AUTH=true \
    opencloudeu/opencloud-${VERSION}

cat  << EOL

OpenCloud ${VERSION} started at https://localhost:${PORT}

Please
* Remove all files
* Set the admin account's quota to 10 MB
* Add a certificate exception in your Thunderbird test profile
EOL