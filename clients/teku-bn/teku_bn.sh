#!/bin/bash

# Immediately abort the script on any error encountered
set -e

teku=/opt/teku/bin/teku

if [ ! -f "/hive/input/genesis.ssz" ]; then
    if [ -z "$HIVE_ETH2_ETH1_RPC_ADDRS" ]; then
      echo "genesis.ssz file is missing, and no Eth1 RPC addr was provided for building genesis from scratch."
      # TODO: alternative to start from weak-subjectivity-state
      exit 1
    fi
fi

# HIVE_ETH2_CONFIG_DEPOSIT_CONTRACT_ADDRESS is ignored, it is part of the chain config.yaml that teku reads.

mkdir -p /data/beacon

LOG=info
case "$HIVE_LOGLEVEL" in
    0|1) LOG=fatal ;;
    2)   LOG=warn  ;;
    3)   LOG=info  ;;
    4)   LOG=debug ;;
    5)   LOG=trace ;;
esac

echo "bootnodes: ${HIVE_ETH2_BOOTNODE_ENRS}"

CONTAINER_IP=`hostname -i | awk '{print $1;}'`
eth1_option=$([[ "$HIVE_ETH2_ETH1_RPC_ADDRS" == "" ]] && echo "--no-option-for-mock-eth1-in-teku-here" || echo "--eth1-endpoints=$HIVE_ETH2_ETH1_RPC_ADDRS")
# TODO: specifying both as eth1 and exec-engine endpoint. `eth` namespace is available on both, but teku needs to update
merge_option=$([[ "$HIVE_ETH2_MERGE_ENABLED" == "" ]] && echo "" || echo "--Xee-endpoint=$HIVE_ETH2_ETH1_RPC_ADDRS")
metrics_option=$([[ "$HIVE_ETH2_METRICS_PORT" == "" ]] && echo "" || echo "--metrics-enabled=true --metrics-interface=0.0.0.0 --metrics-port=$HIVE_ETH2_METRICS_PORT --metrics-host-allowlist=*")
# Teku crashes when the flag is provided but the value is empty
bootnode_option=$([[ "$HIVE_ETH2_BOOTNODE_ENRS" == "" ]] && echo "" || echo "--p2p-discovery-bootnodes=${HIVE_ETH2_BOOTNODE_ENRS:-""}" )

cd /opt/teku

FLAGS="
    --logging=$LOG \
    --log-destination=CONSOLE \
    --data-path=/data/beacon \
    --data-storage-mode=PRUNE \
    --network=/hive/input/config.yaml \
    --initial-state=/hive/input/genesis.ssz \
    $metrics_option $eth1_option $merge_option $bootnode_option \
    --p2p-advertised-port=${HIVE_ETH2_P2P_TCP_PORT:-9000} \
    --p2p-advertised-udp-port=${HIVE_ETH2_P2P_UDP_PORT:-9000} \
    --p2p-enabled=true \
    --p2p-advertised-ip=${CONTAINER_IP} \
    --p2p-nat-method=NONE  \
    --p2p-port=${HIVE_ETH2_P2P_TCP_PORT:-9000} \
    --p2p-udp-port=${HIVE_ETH2_P2P_UDP_PORT:-9000}  \
    --p2p-peer-lower-bound=${HIVE_ETH2_P2P_TARGET_PEERS:-10} \
    --p2p-discovery-enabled=true \
    --rest-api-enabled=true \
    --rest-api-interface=0.0.0.0 \
    --rest-api-port=${HIVE_ETH2_BN_API_PORT:-4000} \
    --rest-api-host-allowlist=* \
    --Xvalidators-proposer-default-fee-recipient=${HIVE_MINER:-"0x1111111111111111111111111111111111111111"}
"

echo "Running teku-bn with flags $FLAGS"
$teku $FLAGS
