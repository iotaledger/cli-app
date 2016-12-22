'use strict';

const chalk = require('chalk');

const setupSeedCommand = (data, refreshAccountData, vorpal) => {
  vorpal
    .command('seed <seed>', 'Sets your seed/password.')
    .alias('password')
    .action((args, callback) => {
      let newSeed = args.seed.toUpperCase().replace(/[^A-Z9]/g, '9').slice(0, 81);
      while (newSeed.length < 81) {
        newSeed += '9';
      }

      if (data.seed !== newSeed) {
        vorpal.log(`Setting seed to "${args.seed}".`);
        vorpal.log(chalk.yellow('Retrieving account data in the background.  You can continue working.\n'));

        data.seed = newSeed;
        data.accountData = undefined;
        refreshAccountData();
      }

      callback();
    });
};

module.exports = setupSeedCommand;
