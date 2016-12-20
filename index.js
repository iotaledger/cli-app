#!/usr/bin/env node
'use strict';

const IOTA = require('iota.lib.js');
const { setDelimiter, setupPrompt } = require('./lib/prompt');
const setupCommands = require('./lib/commands/index');
const vorpal = require('vorpal')();

const data = {
  currentNodeInfo: undefined,
  depth: 9,
  maxNeighbors: 9,
  milestoneLag: 15,
  minNeighbors: 4,
  minWeightMagnitude: 18,
  seed: ''
};

const iotajs = new IOTA({
  host: 'http://localhost',
  port: 14265
});

const refreshServerInfo = () => {
  iotajs.api.getNodeInfo((err, nodeInfo) => {
    if (err) {
      data.currentNodeInfo = undefined;
    } else {
      data.currentNodeInfo = nodeInfo;
    }

    setDelimiter();
  });
};

setupPrompt(data, iotajs, vorpal);
setupCommands(data, iotajs, refreshServerInfo, vorpal);

// Give the local connection a little time to connect, then get new data periodically.
setTimeout(refreshServerInfo, 100);
setInterval(refreshServerInfo, 10 * 1000);

// Give the iotajs connection time to settle before processing command line params
// TODO make this more deterministic.  timeouts = ugly
setTimeout(() => {
  vorpal.parse(process.argv);
}, 100);

vorpal.show();
