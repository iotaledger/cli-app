'use strict';
const chalk = require('chalk');

const setupNumAddressesCommand = (data, refreshAccountData, vorpal) => {
  vorpal
    .command('numAddresses <num>', 'Overestimate a max number of addresses on your seed. Necessary if you have old spent addresses with balances on them.')
    .alias('na')
    .action((args, callback) => {
      if (!args.num || !Number.isInteger(args.num)) {
          vorpal.log(chalk.red('Please specify the number of addresses to search.'));
          return callback();
      }
      if (args.num > 1000) {
          vorpal.log(chalk.red('Too many addresses.'));
          return callback();
      }
      data.numAddresses = args.num;
      if(data.accountData) {
        vorpal.log(chalk.yellow(`Refreshing account data in the background. With a high number of addresses this can take a long time.\n`));
        data.accountData = undefined;
        refreshAccountData();
      }
      callback();
    });
};

module.exports = setupNumAddressesCommand;
