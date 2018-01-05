'use strict';

const chalk = require('chalk');
const isMissingData = require('./validations').isMissingData;
const max_promotions = 3;
const spamTransfer = [{ address: '9'.repeat(81), value: 0, message: '', tag: ''}]

let elapsedInterval;
let promoteCount;

function interrupt() {
    promoteCount++;
    return promoteCount >= max_promotions;
}

const setupPromoteCommand = (data, iotajs, refreshAccountData, vorpal) => {
  vorpal
    .command('promote <hash>', 'Promotes a pending transaction.  Provide an id for additional details.')
    .option('-n <number>', 'Max number of transactions.  Default 10.')
    .autocomplete({
      data: () => {
        vorpal.ui.input(`promote ${vorpal.ui.input().split(' ')[1].toUpperCase()}`);
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
          vorpal.log(chalk.red('You have yet to retrieve your history. Please provide the full hash to promote.'));
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

      // TODO: This should be done in replay as well
      vorpal.log(chalk.yellow('Checking if transaction is already confirmed.'));
      iotajs.api.getBundle(hash, (err, bundle) => {
        if (err) {
          vorpal.log(chalk.red('Bundle unable to be retrieved, are you sure you specified a tail transaction hash?'));
          return callback();
        }
        const inputs = bundle
          .filter(input => input.value < 0)
          .map(input => input.address);
        iotajs.api.isReattachable(inputs, (err, reattachable) => {
          if (err) {
            vorpal.log(chalk.red('Error checking confirmation status.'));
            return callback();
          }
          if (typeof(reattachable) === 'object' && reattachable.some(x => !x)) {
            reattachable = false;
          }
          if(!reattachable) {
            vorpal.log(chalk.red('That transaction is already confirmed.'));
            return callback();
          }
          vorpal.log(`Promoting transaction ${hash}.  This may take a few minutes.`);
          const start = Date.now();
          elapsedInterval = setInterval(() => {
            process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
          });
          iotajs.api.isPromotable(hash).then(state => {
            if (state) {
              promoteCount = 0;
              iotajs.api.promoteTransaction(hash, data.depth, data.minWeightMagnitude, spamTransfer, { interrupt, delay: 1000 }, (err) => {
                if (elapsedInterval) {
                  clearInterval(elapsedInterval);
                  if (err) {
                    vorpal.log(chalk.red(err), '                   \n'); // extra spaces to cover elapsed
                    return callback();
                  }
                  vorpal.log(chalk.green('Promote complete!                 \n')); // extra spaces to cover elapsed
                  if (data.accountData) {
                    vorpal.log(chalk.green('Refreshing transactions...'));
                    refreshAccountData();
                  }
                }
                callback();
              });
            } else {
              clearInterval(elapsedInterval);
              vorpal.log(chalk.red('Your transaction can not be promoted, first replay the transaction then attempt a promote with the new replayed transaction.'));
              return callback();
            }
          });
        });
      });
    })
    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle(() => {});
      vorpal.log(chalk.red('promote cancelled\n'));
    });
};

module.exports = setupPromoteCommand;
