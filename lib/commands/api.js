'use strict';

const chalk = require('chalk');
const isMissingData = require('./validations').isMissingData;
const JSON5 = require('json5'); // for relaxed JSON parsing in the api command
const prompt = require('../prompt');

let passedArguments;

const setupApiCommand = (data, iotajs, vorpal) => {
  const executeCommand = (commandString, iotajs, vorpal, callback) =>
  {
    let command;
    try {
      command = JSON5.parse(commandString);
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
  };
  
  vorpal
    .command('api [command...]', 'Sends an arbitrary command to the node.')
    .parse(function (command, args) { 
      passedArguments = command.indexOf(' ') > 0 ? command.substr(command.indexOf(' ') + 1) : null;
      return command;
    })
    .action(function(args, callback) { // no fat arrow function.  we need 'this'
      if (isMissingData(['node'])) {
        return callback();
      }

      if (passedArguments) {
        executeCommand(passedArguments, iotajs, vorpal, callback);
      } else {
        prompt.pauseDelimiter();
        return this.prompt({
          type: 'input',
          name: 'commandString',
          default: '',
          message: 'Enter the command JSON: ',
          }, result => {
          prompt.unpauseDelimiter();
          if (result.continue) {
            return callback();
          }

          executeCommand(result.commandString, iotajs, vorpal, callback);
        });
      }
    })
    .cancel(() => {
      prompt.unpauseDelimiter();
    });
};

module.exports = setupApiCommand;
