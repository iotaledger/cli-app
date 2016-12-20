'use strict';

const { isMissingData } = require('./validations');
const chalk = require('chalk');
const prettyjson = require('prettyjson');

const setupNeighborsCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('neighbors [address]', 'Shows neighbor information.  Address can be a partial match.')
    .action((args, callback) => {
      if (isMissingData(['node'])) {
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
