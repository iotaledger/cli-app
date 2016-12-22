'use strict';

const chalk = require('chalk');
const isMissingData = require('./validations').isMissingData;
const moment = require('moment');

const setupHistoryCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('history [id]', 'Gets last transactions.  Provide an id for additional details.')
    .option('-n <number>', 'Max number of transactions.  Default 10.')
    .action((args, callback) => {
      if (isMissingData(['node', 'seed', 'accountData'])) {
        return callback();
      }

      const number = args.options.n || 10;
      const transfers = data.accountData.transfers.reverse().slice(0, number);

      const categorizedTransfers = iotajs.utils.categorizeTransfers(transfers, data.accountData.addresses);

      transfers.forEach((bundle, index) => {
        const shortHash = bundle[0].hash.slice(0, 10);
        const persisted = bundle[0].persistence ? bundle[0].persistence : false;
        const thisCategorizeTransfer = categorizedTransfers.sent.filter(t => t[0].hash === bundle[0].hash);
        const time = moment.unix(bundle[0].timestamp).fromNow();
        const type = thisCategorizeTransfer.length > 0 ? 'spending from' : ' receiving to';
        const address = bundle[0].address.slice(0, 10);
        const value = bundle[0].value;
        vorpal.log(`${index < 9 ? ' ' : ''}${index+1}: ${chalk.yellow(shortHash)} - ${type} ${address} - ${value} - ${persisted ? chalk.green('confirmed') : chalk.yellow('pending  ')} - ${time}`);
      });
      vorpal.log('To see more information on a specific transaction, provide a hash next time.\n');

      callback();
    });
};

module.exports = setupHistoryCommand;
