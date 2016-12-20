'use strict';

const isMissingData = require('./validations').isMissingData;
const chalk = require('chalk');
const prettyjson = require('prettyjson');

const setupNodeInfoCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('nodeinfo', 'Shows connected node information.')
    .action((args, callback) => {
      if (isMissingData(['node'])) {
        return callback();
      }

      iotajs.api.getNodeInfo((err, data) => {
        if (err) {
          vorpal.log(chalk.red(err));
          data.currentNodeInfo = undefined;
          return callback();
        }

        delete data.duration;
        vorpal.log(prettyjson.render(data));
        callback();
      });
    });

};

module.exports = setupNodeInfoCommand;
