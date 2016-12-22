'use strict';

const chalk = require('chalk');
const constants = require('../constants');
const isMissingData = require('./validations').isMissingData;
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

        vorpal.log(prettyjson.render(
          data.neighbors.filter(
            n => n.address.indexOf(args.address || '') !== -1
          ),
          constants.prettyJson
        ), '\n');
        callback();
      });
    });
};

module.exports = setupNeighborsCommand;
