'use strict';

const isMissingData = require('./validations').isMissingData;
const chalk = require('chalk');

let elapsedInterval;

// TODO generate a specific index of address if desired
const setupAddressCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('address', 'Generates an address.')
    .action(function(args, callback) {
      if (isMissingData(['node', 'seed'])) {
        return callback();
      }

      vorpal.log('One minute while we generate the address.');
      const start = Date.now();
      elapsedInterval = setInterval(() => {
        process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
      });

      iotajs.api.getNewAddress(data.seed, (err, address) => {
        if (elapsedInterval) {
          if (err) {
            clearInterval(elapsedInterval);
            vorpal.log(chalk.red(err), '\n');
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
            if (elapsedInterval) {
              clearInterval(elapsedInterval);
              if (err) {
                vorpal.log(chalk.red(err));
              }
              vorpal.log('Done.  Your address is ready to use.\n');
              callback();
            }
          });
        }
      });
    })
    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle();
      vorpal.log(chalk.red('cancelled\n'));
    });
};

module.exports = setupAddressCommand;
