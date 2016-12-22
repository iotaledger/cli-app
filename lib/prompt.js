'use strict';

const chalk = require('chalk');
const collapseIotaAmount = require('./utils').collapseIotaAmount;

let data, iotajs, vorpal;

const setupPrompt = (d, i, v) => {
  data = d;
  iotajs = i;
  vorpal = v;
  setDelimiter();
};

const setDelimiter = () => {
  const info = data.currentNodeInfo;

  let status = chalk.red('disconnected');
  if (info) {
    if (
      Math.abs(info.latestMilestoneIndex - info.latestSolidSubtangleMilestoneIndex) < data.milestoneLag &&
      info.neighbors >= data.minNeighbors
    ) {
      status = chalk.green('✓');
    } else {
      status = chalk.yellow(`${info.latestSolidSubtangleMilestoneIndex}/${info.latestMilestoneIndex}`);
    }
  }

  const balance = data.accountData
    ? ` ${collapseIotaAmount(data.accountData.balance)}ι `
    : '';

  const newDelimiter = `${chalk.cyan.bold('iota')} (${iotajs.host}:${iotajs.port} ${status})${balance}${chalk.italic(':')} `;

  if (newDelimiter !== vorpal.ui.delimiter()) {
    vorpal.delimiter(newDelimiter);
    vorpal.ui.delimiter(newDelimiter);
  }
};

module.exports = {
  setupPrompt,
  setDelimiter
};
