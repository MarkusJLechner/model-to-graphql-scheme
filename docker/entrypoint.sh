#!/usr/bin/env bash

echo "run entrypoint..."

if [ ! -f "/var/www/html/.env" ]
then
    echo "######################################################################################"
    echo ""
    echo "    .env is missing!"
    echo ""
    echo "######################################################################################"
fi

# wait for mysql service healthy
sleep 8
while ! wget  -q --spider mysql:3306; do
    echo "wait for db connection..."
    sleep 3
done

exec "$@"
