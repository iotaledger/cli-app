'use strict';

const chalk = require('chalk');

let data, vorpal;

const setupValidators = (d, v) => {
  data = d;
  vorpal = v;
};

const isMissingData = (list) => {
  if (list.indexOf('node') && !data.currentNodeInfo) {
    vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".\n'));
    return true;
  }

  if (list.indexOf('seed') && !data.seed) {
    vorpal.log(chalk.red('Please set a seed first with the "seed" command.\n'));
    return true;
  }

  return false;
};

module.exports = {
  isMissingData,
  setupValidators
};
