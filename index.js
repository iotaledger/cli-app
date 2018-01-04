#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const config = require('./lib/config');
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
  minWeightMagnitude: 3,
  seed: '',
  numAddresses: undefined
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
    var options = {'start': 0, 'end': data.numAddresses};
    iotajs.api.getAccountData(data.seed,  options, (err, accountData) => {
      if (err) {
        // on fail, retry fast
        refreshAccountDataTimer = setTimeout(refreshAccountData, 10 * 1000);
        return;
      }

      if (!data.accountData) {
        vorpal.log(chalk.green('Account data retrieved.'));
      }
      data.accountData = accountData;
      setDelimiter();

      // on success, refresh slowly.
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

      // Also, see if we should store this node info in the config file
      config.get('nodes', []).then(nodes => {
        const node = `${iotajs.host}:${iotajs.port}`.replace('http://', '');
        if (nodes.indexOf(node) === -1) {
          nodes.push(node);
          nodes = nodes.sort();
          config.set('nodes', nodes);
        }
      });
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

const version = require('./package.json').version;
vorpal.log(chalk.green(`Running IOTA CLI v${version}\n`));

// Give the iotajs connection time to settle before processing command line params
// TODO make this more deterministic.  timeouts = ugly
setTimeout(() => {
  vorpal.parse(process.argv);
}, 100);

vorpal.show();
