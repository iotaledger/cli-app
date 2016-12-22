#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const IOTA = require('iota.lib.js');
const prompt = require('./lib/prompt');
const setupCommands = require('./lib/commands/index');
const vorpal = require('vorpal')();

const setDelimiter = prompt.setDelimiter;
const setupPrompt = prompt.setupPrompt;

const data = {
  accountData: undefined,
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

let refreshAccountDataTimer;
const refreshAccountData = () => {
  if (refreshAccountDataTimer) {
    clearTimeout(refreshAccountDataTimer);
  }

  if (data.seed) {
    iotajs.api.getAccountData(data.seed, (err, accountData) => {
      if (err) {
        // on fail, retry fast
        refreshAccountDataTimer = setTimeout(refreshAccountData, 30 * 1000);
        return;
      }

      if (!data.accountData) {
        vorpal.log(chalk.green('Account data retrieved.'));
      }
      data.accountData = accountData;
      // on success, retry slow.
      refreshAccountDataTimer = setTimeout(refreshAccountData, 2 * 60 * 1000);
    });
  }
};

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
setupCommands(data, iotajs, refreshAccountData, refreshServerInfo, vorpal);

// Give the local connection a little time to connect, then get new data periodically.
// TODO make this more deterministic.  timeouts = ugly
setTimeout(refreshServerInfo, 100);
setInterval(refreshServerInfo, 15 * 1000);

// Give the iotajs connection time to settle before processing command line params
// TODO make this more deterministic.  timeouts = ugly
setTimeout(() => {
  vorpal.parse(process.argv);
}, 100);

vorpal.show();
