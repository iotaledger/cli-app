'use strict';

const chalk = require('chalk');
const moment = require('moment');

const setupQueueCommand = (data, queue, vorpal) => {
    vorpal
    .command('queue', 'Shows queue transactions.')
    .action((args, callback) => {
        vorpal.log('Queued transactions:\n');
        vorpal.log(' index\ttime\t\ttype\tstatus\tattempts\tmessage');
        queue.data.forEach(
            (transaction, index) => {
                if (transaction.status === 'working') {
                    const time = moment.unix(transaction.attemptStart/1000).fromNow();
                    vorpal.log(
                        ` ${index+1}:\t${time}\t${transaction.type}\t${chalk.yellow('working')}\t${transaction.attempts}\t${transaction.message}`
                    );
                } else if (transaction.status === 'success') {
                    const time = moment.unix(transaction.timestamp/1000).fromNow();
                    vorpal.log(
                        ` ${index+1}:\t${time}\t${transaction.type}\t${chalk.green('success')}\t${transaction.attempts}\t${transaction.message}`
                    );
                } else {
                    const time = moment.unix(transaction.timestamp/1000).fromNow();
                    vorpal.log(
                        ` ${index+1}:\t${time}\t${transaction.type}\t${transaction.status}\t${transaction.attempts}\t${transaction.message}`
                    );
                }

            }
        );

        callback();
    });

};

module.exports = setupQueueCommand;
