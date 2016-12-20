'use strict';

const chalk = require('chalk');
const prettyjson = require('prettyjson');

const setupNodeInfoCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('nodeinfo', 'Shows connected node information.')
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

        delete data.duration;
        vorpal.log(prettyjson.render(data));
        callback();
      });
    });

};

module.exports = setupNodeInfoCommand;
