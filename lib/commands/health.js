'use strict';

const chalk = require('chalk');

const setupHealthCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('healthcheck', 'Looks for any node problems.')
    .alias('health')
    .action((args, callback) => {
      if (!data.currentNodeInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
        return callback();
      }

      iotajs.api.getNodeInfo((err, data) => {
        if (err) {
          data.currentNodeInfo = undefined;
          return callback();
        }

        vorpal.log(`Free memory: ${
          data.jreFreeMemory > 500000
            ? chalk.green('✓')
            : chalk.red(data.jreFreeMemory)}`);

        vorpal.log(`Node sync: ${
          Math.abs(data.latestMilestoneIndex - data.latestSolidSubtangleMilestoneIndex) < data.milestoneLag
            ? chalk.green('✓')
            : chalk.red('out of sync')}`);

        vorpal.log(`Number of neighbors (${data.minNeighbors}-${data.maxNeighbors}): ${
          data.neighbors >= data.minNeighbors && data.neighbors <= data.maxNeighbors
            ? chalk.green('✓')
            : chalk.red('you need between 4 and 9 neighbors.  You have ${data.neighbors.length}')}`);

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
    });
};

module.exports = setupHealthCommand;
