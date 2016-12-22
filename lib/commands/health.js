'use strict';

const isMissingData = require('./validations').isMissingData;
const chalk = require('chalk');

const setupHealthCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('healthcheck', 'Looks for any node problems.')
    .alias('health')
    .action((args, callback) => {
      if (isMissingData(['node'])) {
        return callback();
      }

      const info = data.currentNodeInfo;

      vorpal.log(`Free memory: ${
        info.jreFreeMemory > 500000
          ? chalk.green('✓')
          : chalk.red(info.jreFreeMemory)}`);

      vorpal.log(`Node sync: ${
        Math.abs(info.latestMilestoneIndex - info.latestSolidSubtangleMilestoneIndex) < data.milestoneLag
          ? chalk.green('✓')
          : chalk.red('out of sync')}`);

      vorpal.log(`Number of neighbors (${data.minNeighbors}-${data.maxNeighbors}): ${
        info.neighbors >= data.minNeighbors && info.neighbors <= data.maxNeighbors
          ? chalk.green('✓')
          : chalk.red(`you need between 4 and 9 neighbors.  You have ${info.neighbors}`)}`);

      iotajs.api.getNeighbors((err, neighborData) => {
        if (err) {
          vorpal.log(chalk.red(err));
          return callback();
        }

        neighborData.neighbors.filter(
          n => n.numberOfAllTransactions === 0
        ).forEach(
          n => vorpal.log(chalk.red(`Inactive neighbor: ${n.address}`))
        );
        callback();
      });
    });
};

module.exports = setupHealthCommand;
