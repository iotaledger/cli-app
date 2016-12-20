'use strict';

const { isMissingData } = require('./validations');
const chalk = require('chalk');

const setupAddressCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('address', 'Generates an address.')
    .action(function(args, callback) {
      if (isMissingData(['node', 'seed'])) {
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
