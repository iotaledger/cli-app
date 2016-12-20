'use strict';

const { isMissingData } = require('./validations');
const chalk = require('chalk');

let elapsedInterval;

const setupTransferCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('transfer <address> <value>', 'Sends iotas to the address')

    .action((args, callback) => {
      if (isMissingData(['node', 'seed'])) {
        return callback();
      }

      if (Number.isNaN(args.value) || Math.floor(args.value) !== args.value) {
        vorpal.log(chalk.red('Please supply an integer for the value.'));
        return callback();
      }

      if (parseInt(args.value) === 0) {
        vorpal.log(chalk.red('The value cannot be zero.'));
        return callback();
      }

      if (args.address.length === 90 && !iotajs.utils.isValidChecksum(args.address)) {
        vorpal.log(chalk.red('That address appears malformed.  Please check it.'));
        return callback();
      }

      const address = args.address.length === 81
        ? iotajs.utils.addChecksum(args.address)
        : args.address;

      vorpal.log('One moment while the transfer is made.  This can take a few minutes.');
      const start = Date.now();
      elapsedInterval = setInterval(() => {
        process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
      });

      const transfers = [{
        address,
        value: parseInt(args.value),
        message: '',
        tag: ''
      }];

      iotajs.api.sendTransfer(data.seed, data.depth, data.minWeightMagnitude, transfers, err => {
        if (elapsedInterval) {
          clearInterval(elapsedInterval);
          if (err) {
            vorpal.log(chalk.red(err), '\n');
            return callback();
          }

          vorpal.log(chalk.green('Transfer complete!\n'));
        }
        callback();
      });
    })

    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle();
      vorpal.log(chalk.red('transfer cancelled\n'));
    });
};

module.exports = setupTransferCommand;
