package main

import "github.com/ethereum/hive/hivesim"

type ClientDefinitionsByRole struct {
	Beacon             []*hivesim.ClientDefinition `json:"beacon"`
	Validator          []*hivesim.ClientDefinition `json:"validator"`
	BeaconAndValidator []*hivesim.ClientDefinition `json:"beaconAndValidator"`
	Eth1               []*hivesim.ClientDefinition `json:"eth1"`
	Other              []*hivesim.ClientDefinition `json:"Other"`
}

func ClientsByRole(available []*hivesim.ClientDefinition) *ClientDefinitionsByRole {
	var out ClientDefinitionsByRole
	for _, client := range available {
		if client.HasRole("beacon") {
			out.Beacon = append(out.Beacon, client)
		}
		if client.HasRole("validator") {
			out.Validator = append(out.Validator, client)
		}
		if client.HasRole("beacon-validator") {
			out.BeaconAndValidator = append(out.BeaconAndValidator, client)
		}
		if client.HasRole("eth1") {
			out.Eth1 = append(out.Eth1, client)
		}
	}
	return &out
}

func (c *ClientDefinitionsByRole) ClientByNameAndRole(name, role string) *hivesim.ClientDefinition {
	switch role {
	case "beacon":
		return byName(c.Beacon, name)
	case "validator":
		return byName(c.Validator, name)
	case "beacon-validator":
		return byName(c.BeaconAndValidator, name)
	case "eth1":
		return byName(c.Eth1, name)
	}
	return nil
}

func byName(clients []*hivesim.ClientDefinition, name string) *hivesim.ClientDefinition {
	for _, client := range clients {
		if client.Name == name {
			return client
		}
	}
	return nil
}

func (c *ClientDefinitionsByRole) Combinations() []node {
	var nodes []node
	for _, beacon := range c.Beacon {
		for _, eth1 := range c.Eth1 {
			nodes = append(nodes, node{eth1.Name, beacon.Name[:len(beacon.Name)-3]})
		}
	}
	for _, eth1 := range c.Eth1 {
		for _, combo := range c.BeaconAndValidator {
			nodes = append(nodes, node{eth1.Name, combo.Name})
		}
	}
	return nodes
}
