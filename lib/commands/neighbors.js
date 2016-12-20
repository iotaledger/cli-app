'use strict';

const chalk = require('chalk');
const prettyjson = require('prettyjson');

const setupNeighborsCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('neighbors [address]', 'Shows neighbor information.  Address can be a partial match.')
    .action((args, callback) => {
      if (!data.currentNodeInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
        return callback();
      }

      iotajs.api.getNeighbors((err, data) => {
        if (err) {
          vorpal.log(chalk.red(err));
          return callback();
        }

        vorpal.log(prettyjson.render(data.neighbors.filter(
          n => n.address.indexOf(args.address || '') !== -1
        )));
        callback();
      });
    });
};

module.exports = setupNeighborsCommand;
