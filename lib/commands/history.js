'use strict';

const chalk = require('chalk');
const constants = require('../constants');
const isMissingData = require('./validations').isMissingData;
const leftPad = require('left-pad');
const moment = require('moment');
const prettyjson = require('prettyjson');

const setupHistoryCommand = (data, iotajs, vorpal) => {
  const showSpecificItem = (id, callback) => {
    // The history command identifies every bundle by the hash of the first tx in it.
    const matchingBundles = data.accountData.transfers.filter(
      bundle => bundle[0].hash.indexOf(id.toUpperCase()) !== -1
    );

    if (matchingBundles.length === 0) {
      vorpal.log(chalk.red('No transactions match that hash.\n'));
      return callback();
    }

    const cleanedUpBundles = matchingBundles.map(
      bundle => bundle.map(
        item => {
          const newItem = Object.assign({}, item);
          delete newItem.signatureMessageFragment;
          return newItem;
        }
      )
    );

    vorpal.log(prettyjson.render(cleanedUpBundles, constants.prettyJson), '\n');

    callback();
  };

  const showItems = (number, callback) => {
    const reverseTransfers = data.accountData.transfers.slice(0).reverse();
    const transfers = reverseTransfers.slice(0, number);

    const categorizedTransfers = iotajs.utils.categorizeTransfers(transfers, data.accountData.addresses);

    const biggestValue = transfers.reduce(
      (biggest, bundle) => biggest > bundle[0].value ? biggest : bundle[0].value,
      0
    ) + '';

    transfers.forEach((bundle, index) => {
      const shortAddress = bundle[0].address.slice(0, 6);
      const persisted = bundle[0].persistence ? bundle[0].persistence : false;
      const shortHash = bundle[0].hash.slice(0, 6);
      const time = moment.unix(bundle[0].timestamp).fromNow();
      const value = bundle[0].value;

      const thisCategorizeTransfer = categorizedTransfers.sent.filter(t => t[0].hash === bundle[0].hash);
      const type = bundle.length === 1 && bundle[0].value === 0
        ? leftPad('address', 13)
        : thisCategorizeTransfer.length > 0 ? 'spending from' : leftPad('receiving to', 13);

      vorpal.log(`${index < 9 ? ' ' : ''}${index+1}: ${chalk.yellow(shortHash)} - ${type} ${shortAddress} - ${leftPad(value, biggestValue.length)} - ${persisted ? chalk.green('confirmed') : chalk.yellow('pending  ')} - ${time}`);
    });
    vorpal.log(chalk.cyan('\nTo see more information on a specific transaction, provide a hash next time.\n'));

    callback();
  };

  vorpal
    .command('history [id]', 'Gets last transactions.  Provide an id for additional details.')
    .option('-n <number>', 'Max number of transactions.  Default 10.')
    .autocomplete({
      data: () => {
        vorpal.ui.input(`history ${vorpal.ui.input().split(' ')[1].toUpperCase()}`);
        return data.accountData.transfers.map(b => b[0]).map(b => b.hash.slice(0, 6));
      }
    })
    .action((args, callback) => {
      if (isMissingData(['node', 'seed', 'accountData'])) {
        return callback();
      }

      if (args.id) {
        showSpecificItem(args.id, callback);
      } else {
        const number = args.options.n || 10;
        showItems(number, callback);
      }
    });
};

module.exports = setupHistoryCommand;
