'use strict';

const { isMissingData } = require('./validations');
const chalk = require('chalk');
const Promise = require('bluebird'); // For older node systems that don't have promise built in.

const setupBalanceCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('balance', 'Gets balance for current seed')
    .action((args, callback) => {
      if (isMissingData(['node', 'seed'])) {
        return callback();
      }

      vorpal.log('One moment while we collect the data.');

      new Promise((resolve, reject) => {
        iotajs.api.getNewAddress(data.seed, {returnAll: true}, (err, addresses) => {
          if (err) {
            return reject(err);
          }

          resolve(addresses);
        });
      })
      .then(addresses => new Promise((resolve, reject) => {
        iotajs.api.getBalances(addresses, 100, (err, data) => {
          if (err) {
            return reject(err);
          }

          const balance = data.balances.reduce((prev, curr) => prev + parseInt(curr), 0);
          vorpal.log(`Your current balance is ${chalk.yellow(balance)} iota.`);

          resolve();
        });
      }))
      .catch(err => vorpal.log(chalk.red(err)))
      .finally(callback);
    });
};

module.exports = setupBalanceCommand;
