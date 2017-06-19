'use strict';

const chalk = require('chalk');
const isMissingData = require('./validations').isMissingData;
const Promise = require('bluebird');

const setupAddressCommand = (data, iotajs, queue, vorpal) => {
    vorpal
    .command('address', 'Generates an address.')
    .action(function(args, callback) {
        if (isMissingData(['node', 'seed'])) {
            return callback();
        }

        vorpal.log('One minute while we generate the address.');

        iotajs.api.getNewAddress(data.seed, (err, address) => {
            if (err) {
                vorpal.log(chalk.red(err), '\n');
                return callback();
            }

            const addressWithChecksum = iotajs.utils.addChecksum(address);
            vorpal.log(`The address is ${chalk.yellow(addressWithChecksum)}`);
            vorpal.log('We will register that address into the iota tangle so that you can use it.');

            const onWork = () => new Promise((resolve, reject) => {
                const transfers = [{
                    address,
                    value: 0,
                    message: '',
                    tag: ''
                }];

                iotajs.api.sendTransfer(data.seed, data.depth, data.minWeightMagnitude, transfers, (err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve(`${chalk.yellow(addressWithChecksum)} is ready to use.\n`);
                });
            });

            const onCancel = callback => iotajs.api.interruptAttachingToTangle(callback);

            queue.addToQueue({
                onCancel,
                onWork,
                timeout: 10 * 60 * 1000,
                tries: 3,
                type: 'address'
            });

            callback();
        });
    });
};

module.exports = setupAddressCommand;
