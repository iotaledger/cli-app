'use strict';

const chalk = require('chalk');
const config = require('../config');
const crypto = require('crypto');
const Promise = require('bluebird');
const prompt = require('../prompt');

const setupSeedCommand = (data, refreshAccountData, vorpal) => {
  vorpal
    .command('seed [seed]', 'Sets your seed/password.  If you don\'t provide a seed one will be generated.')
    .alias('password')
    .autocomplete({
      data: () => {
        vorpal.ui.input(`seed ${vorpal.ui.input().split(' ')[1].toUpperCase()}`);
        return config.get('seeds', ['']);
      }
    })
    .action(function(args, callback) {
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
      }

      if (data.seed === newSeed) {
        // Nothing to do...
        return callback();
      }

      vorpal.log(`Setting seed to "${args.seed}".`);
      vorpal.log(chalk.yellow('Retrieving account data in the background.  You can continue working.\n'));

      config.get('seeds', []).then(seeds => new Promise(resolve => {
        if (seeds.indexOf(newSeed.replace(/9+$/, '')) !== -1) {
          // all good.  Moving on.
          return resolve();
        }

        prompt.pauseDelimiter();
        this.prompt({
          type: 'confirm',
          name: 'save',
          default: false,
          message: 'Would you like to save this seed for autocomplete?  Only do this if this computer is private.\n',
        }, result => {
          prompt.unpauseDelimiter();
          if (!result.save) {
            return resolve();
          }

          seeds.push(newSeed.replace(/9+$/, ''));
          config.set('seeds', seeds);
          resolve();
        });
      }))
      .then(() => {
        data.seed = newSeed;
        data.accountData = undefined;
        refreshAccountData();
        callback();
      });
    })
    .cancel(() => {
      prompt.unpauseDelimiter();
    });
};

module.exports = setupSeedCommand;
