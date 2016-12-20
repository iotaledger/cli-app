'use strict';

const { isMissingData } = require('./validations');
const chalk = require('chalk');
const JSON5 = require('json5'); // for relaxed JSON parsing in the api command

const setupApiCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('api', 'Sends an arbitrary command to the node')
    .action(function(args, callback) {
      if (isMissingData(['node'])) {
        return callback();
      }

      return this.prompt({
        type: 'input',
        name: 'commandString',
        default: '',
        message: 'Enter the command JSON: ',
      }, result => {
        if (result.continue) {
          return callback();
        }

        let command;
        try {
          command = JSON5.parse(result.commandString);
        } catch (err) {
          vorpal.log(chalk.red(`Invalid JSON: ${err}`));
          return callback();
        }

        iotajs.api.sendCommand(command, (err, success) => {
          if (err) {
            vorpal.log(chalk.red(err));
            return callback();
          }

          vorpal.log(JSON.stringify(success, null, 2));
          callback();
        });
      });
    });
};

module.exports = setupApiCommand;
