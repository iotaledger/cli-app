'use strict';

const setupAddressCommand = require('./address');
const setupApiCommand = require('./api');
const setupBalanceCommand = require('./balance');
const setupDepthCommand =require('./depth');
const setupHealthCommand = require('./health');
const setupMWMCommand = require('./mwm');
const setupNeighborsCommand = require('./neighbors');
const setupNodeCommand = require('./node');
const setupNodeInfoCommand = require('./nodeinfo');
const setupSeedCommand = require('./seed');
const setupTransferCommand = require('./transfer');

module.exports = (data, iotajs, refreshServerInfo, vorpal) => {
  setupAddressCommand(data, iotajs, vorpal);
  setupApiCommand(data, iotajs, vorpal);
  setupBalanceCommand(data, iotajs, vorpal);
  setupDepthCommand(data, vorpal);
  setupHealthCommand(data, iotajs, vorpal);
  setupMWMCommand(data, vorpal);
  setupNeighborsCommand(data, iotajs, vorpal);
  setupNodeCommand(data, iotajs, refreshServerInfo, vorpal);
  setupNodeInfoCommand(data, iotajs, vorpal);
  setupSeedCommand(data, vorpal);
  setupTransferCommand(data, iotajs, vorpal);
};
