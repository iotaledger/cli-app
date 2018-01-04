'use strict';

const chalk = require('chalk');
const isMissingData = require('./validations').isMissingData;

let elapsedInterval;

const setupReplayCommand = (data, iotajs, refreshAccountData, vorpal) => {
  vorpal
    .command('replay <hash>', 'Replays a pending transaction.  Provide an id for additional details.')
    .option('-n <number>', 'Max number of transactions.  Default 10.')
    .autocomplete({
      data: () => {
        vorpal.ui.input(`replay ${vorpal.ui.input().split(' ')[1].toUpperCase()}`);
        if (!data.accountData) {
          return [];
        }
        return data.accountData.transfers.map(b => b[0]).map(t => t.hash.slice(0, 6));
      }
    })
    .action((args, callback) => {
      if (isMissingData(['node'])) {
        return callback();
      }

      let hash = args.hash;
      if (hash.length < 81) {
        if (!data.accountData) {
          vorpal.log(chalk.red('Please provide a full transaction hash'));
          return callback();
        }

        const transactionsMatchingHash = data.accountData.transfers
          .map(b => b[0])
          .filter(t => t.hash.indexOf(hash) !== -1);
        if (transactionsMatchingHash.length === 0) {
          vorpal.log(chalk.red('That hash does not match a transaction'));
          return callback();
        }
        hash = transactionsMatchingHash[0].hash;
      }

      vorpal.log(`Replaying transaction ${hash}.  This may take a few minutes.`);
      const start = Date.now();
      elapsedInterval = setInterval(() => {
        process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
      });

      iotajs.api.replayBundle(hash, data.depth, data.minWeightMagnitude, (err) => {
        if (elapsedInterval) {
          clearInterval(elapsedInterval);
          if (err) {
            vorpal.log(chalk.red(err), '                   \n'); // extra spaces to cover elapsed
            return callback();
          }

          vorpal.log(chalk.green('Replay complete! Refreshing transactions...\n')); // extra spaces to cover elapsed
          refreshAccountData();
        }
        callback();
      });
    })

    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle(() => {});
      vorpal.log(chalk.red('replay cancelled\n'));
    });
};

module.exports = setupReplayCommand;
