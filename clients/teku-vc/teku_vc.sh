#!/bin/bash

# Immediately abort the script on any error encountered
set -e

teku=/opt/teku/bin/teku

mkdir -p /data/vc
mkdir -p /data/validators
mkdir -p /data/secrets

shopt -s nullglob  # do not match "*" if keystores dir is empty
for keystore_path in /hive/input/keystores/*
do
  pubkey=$(basename "$keystore_path")
  cp "/hive/input/keystores/$pubkey/keystore.json" "/data/validators/$pubkey.json"
  chmod 0644 "/data/validators/$pubkey.json"
  cp "/hive/input/secrets/$pubkey" "/data/secrets/$pubkey.txt"  # must be a txt file
  chmod 0644 "/data/secrets/$pubkey.txt"
done

LOG=info
case "$HIVE_LOGLEVEL" in
    0|1) LOG=fatal ;;
    2)   LOG=warn  ;;
    3)   LOG=info  ;;
    4)   LOG=debug ;;
    5)   LOG=trace ;;
esac

cd /opt/teku

FLAGS="
    --logging=$LOG \
    --log-destination=CONSOLE \
    --data-path=/data/vc \
    vc \
    --network=auto \
    --validator-keys=/data/validators:/data/secrets \
    --validators-keystore-locking-enabled=false \
    --beacon-node-api-endpoint=http://$HIVE_ETH2_BN_API_IP:$HIVE_ETH2_BN_API_PORT \
    --Xvalidators-proposer-default-fee-recipient=${HIVE_MINER:-"0x1111111111111111111111111111111111111111"}
"

echo "Running teku-vc with flags $FLAGS"
$teku $FLAGS
