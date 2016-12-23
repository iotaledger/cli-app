'use strict';

const chalk = require('chalk');
const crypto = require('crypto');

const setupSeedCommand = (data, refreshAccountData, vorpal) => {
  vorpal
    .command('seed [seed]', 'Sets your seed/password.  If you don\'t provide a seed one will be generated.')
    .alias('password')
    .action((args, callback) => {
      let newSeed = '';
      if (!args.seed) {
        const characters = '9ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let i = 0; i < 81; ++i) {
          newSeed += characters[parseInt(crypto.randomBytes(4).toString('hex'), 16) % 27];
        }

        vorpal.log(`A new seed was generated for you: ${chalk.yellow(newSeed)}.  Please DO NOT LOSE THIS.`);
      } else {
        if (args.seed.length < 30) {
          vorpal.log(chalk.red('Caution, your seed is very short.  This makes it vulnerable to guessing.  You should REALLY consider moving your iotas to a stronger seed.'));
        }

        newSeed = args.seed.toUpperCase().replace(/[^A-Z9]/g, '9').slice(0, 81);
        while (newSeed.length < 81) {
          newSeed += '9';
        }
        vorpal.log(`Setting seed to "${args.seed}".`);
      }

      if (data.seed !== newSeed) {
        vorpal.log(chalk.yellow('Retrieving account data in the background.  You can continue working.\n'));

        data.seed = newSeed;
        data.accountData = undefined;
        refreshAccountData();
      }

      callback();
    });
};

module.exports = setupSeedCommand;
