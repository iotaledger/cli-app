'use strict';

const chalk = require('chalk');

const setupAddressCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('address', 'Generates an address.')
    .action(function(args, callback) {
      if (!data.currentNodeInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
        return callback();
      }

      if (!data.seed) {
        vorpal.log(chalk.red('Please set a seed first with the "seed" command.'));
        return callback();
      }

      vorpal.log('One minute while we generate the address.');

      iotajs.api.getNewAddress(data.seed, (err, address) => {
        if (err) {
          vorpal.log(chalk.red(err));
          return callback();
        }

        const addressWithChecksum = iotajs.utils.addChecksum(address);
        vorpal.log(`The address is ${chalk.yellow(addressWithChecksum)}`);
        vorpal.log('Now we will register that address into the iota tangle.  One moment.');

        const transfers = [{
          address,
          value: 0,
          message: '',
          tag: ''
        }];

        iotajs.api.sendTransfer(data.seed, data.depth, data.minWeightMagnitude, transfers, (err) => {
          if (err) {
            vorpal.log(chalk.red(err));
          }
          vorpal.log('Done.  Your address is ready to use.');
          callback();
        });
      });
    });
};

module.exports = setupAddressCommand;
