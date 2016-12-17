const chalk = require('chalk');
const IOTA = require('iota.lib.js');
const prettyjson = require('prettyjson');
const Promise = require('bluebird');
const vorpal = require('vorpal')();

let addresses = undefined;
let balance = 0;
let currentServerInfo = undefined;
let seed = '';

let iotajs = new IOTA({
  host: 'http://localhost',
  port: 14265
});

const setDelimiter = () => {
  let status = chalk.red('disconnected');
  if (currentServerInfo) {
    if (
      Math.abs(currentServerInfo.latestMilestoneIndex - currentServerInfo.latestSolidSubtangleMilestoneIndex) < 15 &&
      currentServerInfo.neighbors >= 4
    ) {
      status = chalk.green('✓');
    } else {
      status = chalk.yellow(`${currentServerInfo.latestSolidSubtangleMilestoneIndex}/${currentServerInfo.latestMilestoneIndex}`);
    }
  }
  const newDelimiter = `iota (${iotajs.host}:${iotajs.port} ${status})$ `;

  if (newDelimiter !== vorpal.ui.delimiter()) {
    vorpal.delimiter(newDelimiter);
    vorpal.ui.delimiter(newDelimiter);
  }
};

const refreshServerInfo = () => {
  iotajs.api.getNodeInfo((err, serverInfo) => {
    if (err) {
      currentServerInfo = undefined;
      return;
    }

    currentServerInfo = serverInfo;
    setDelimiter();
  });
};

vorpal
    .command('balance', 'Gets balance for current seed')
    .action((args, callback) => {
      if (!currentServerInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "server".'));
        return callback();
      }

      if (!seed) {
        vorpal.log(chalk.red('Please set a seed first with the "seed" command.'));
        return callback();
      }

      vorpal.log('One moment while we collect the data.');

      new Promise((resolve, reject) => {
        if (addresses) {
          return resolve(addresses);
        }

        iotajs.api.getNewAddress(seed, {returnAll: true}, (err, allAddresses) => {
          if (err) {
            return reject(err);
          }

          addresses = allAddresses;
          resolve(addresses);
        });
      })
      .then(addresses => new Promise((resolve, reject) => {
        iotajs.api.getBalances(addresses, 100, (err, data) => {
          if (err) {
            return reject(err);
          }

          balance = data.balances.reduce((prev, curr) => prev + parseInt(curr), 0);
          vorpal.log(`Your current balance is ${balance} iota`);

          resolve();
        });
      }))
      .catch(err => vorpal.log(chalk.red(err)))
      .finally(callback);
    });

vorpal
    .command('healthcheck', 'Looks for any node problems.')
    .action((args, callback) => {
      if (!currentServerInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "server".'));
        return callback();
      }

      iotajs.api.getNodeInfo((err, data) => {
        if (err) {
          currentServerInfo = undefined;
          return callback();
        }

        vorpal.log(`Free memory: ${
          data.jreFreeMemory > 500000
            ? chalk.green('✓')
            : chalk.red(data.jreFreeMemory)}`);

        vorpal.log(`Node sync: ${
          Math.abs(data.latestMilestoneIndex - data.latestSolidSubtangleMilestoneIndex) < 15
            ? chalk.green('✓')
            : chalk.red('out of sync')}`);

        vorpal.log(`Number of neighbors: ${
          data.neighbors >= 4 && data.neighbors <= 9
            ? chalk.green('✓')
            : chalk.red('you need between 4 and 9 neighbors.  You have ${data.neighbors.length}')}`);

        iotajs.api.getNeighbors((err, neighborData) => {
          if (err) {
            return callback();
          }

          neighborData.neighbors.filter(
            n => n.numberOfAllTransactions === 0
          ).forEach(
            n => vorpal.log(chalk.red(`Inactive neighbor: ${n.address}`))
          );
          callback();
        });
      });
    });

vorpal
    .command('neighbors [address]', 'Shows neighbor information.  Address can be a partial match.')
    .action((args, callback) => {
      if (!currentServerInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "server".'));
        return callback();
      }

      iotajs.api.getNeighbors((err, data) => {
        if (err) {
          return callback();
        }

        vorpal.log(prettyjson.render(data.neighbors.filter(
          n => n.address.indexOf(args.address || '') !== -1
        )));
        callback();
      });
    });

vorpal
    .command('nodeinfo', 'Shows connected node information.')
    .action((args, callback) => {
      if (!currentServerInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "server".'));
        return callback();
      }

      iotajs.api.getNodeInfo((err, data) => {
        if (err) {
          currentServerInfo = undefined;
          return callback();
        }

        delete data.duration;
        vorpal.log(prettyjson.render(data));
        callback();
      });
    });

vorpal
    .command('seed <seed>', 'Sets your seed/password.')
    .action((args, callback) => {
      vorpal.log(`Setting seed to "${args.seed}"`);
      seed = args.seed.toUpperCase().replace(/[^A-Z9]/g, '9');
      while (seed.length < 81) {
        seed += '9';
      }
      if (seed.length > 81) {
        seed = seed.slice(0, 81);
      }
      balance = 0;
      callback();
    });

vorpal
  .command('server <address>', 'connects to a new iota node. (ex. 1.2.3.4)')
  .action((args, callback) => {
    const pieces = args.address.replace(/\d:\/\//, '').split(':');
    const host = `http://${pieces[0]}`;
    let port = 14265;
    if (pieces.length > 1) {
      const trialPort = Number(pieces[1]);
      if (Number.isNaN(trialPort)) {
        vorpal.log('Port must be a number.  (ex. 1.2.3.4:12465)');
        return callback();
      }
      port = trialPort;
    }

    iotajs.changeNode({host, port});
    if (host !== 'http://localhost') {
      vorpal.log('This may take a few seconds for a remote node.  Did you turn on remote access?');
    }
    balance = 0;
    refreshServerInfo();
    callback();
  });

vorpal
  .command('transfer <address> <value>', 'Sends iotas to the address')
  .action((args, callback) => {
    if (!currentServerInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "server".'));
      return callback();
    }

    if (!seed) {
      vorpal.log(chalk.red('Please set a seed first with the "seed" command.'));
      return callback();
    }

    if (Number.isNaN(args.value) || Math.floor(args.value) !== args.value) {
      vorpal.log(chalk.red('Please supply an integer amount.'));
      return callback();
    }

    vorpal.log('One moment while the transfer is made.  This can take a few minutes.');
    // TODO handle message and tag
    var transfers = [{
      address: args.address,
      value: parseInt(args.value),
      message: '',
      tag: ''
    }];

    iotajs.api.sendTransfer(seed, 9, 18, transfers, {}, err => {
      if (err) {
        vorpal.log(chalk.red(err));
      }
      callback();
    });
  });

setDelimiter();
refreshServerInfo();
setInterval(refreshServerInfo, 10 * 1000);

vorpal.show();
