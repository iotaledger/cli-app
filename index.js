'use strict';

const chalk = require('chalk');
const IOTA = require('iota.lib.js');
const JSON5 = require('json5'); // for relaxed JSON parsing in the api command
const prettyjson = require('prettyjson');
const Promise = require('bluebird');
const vorpal = require('vorpal')();

const milestoneLag = 15;
const minNeighbors = 4;
const maxNeighbors = 9;

let currentNodeInfo = undefined;
let depth = 9;
let minWeightMagnitude = 18;
let seed = '';

let iotajs = new IOTA({
  host: 'http://localhost',
  port: 14265
});

const setDelimiter = () => {
  let status = chalk.red('disconnected');
  if (currentNodeInfo) {
    if (
      Math.abs(currentNodeInfo.latestMilestoneIndex - currentNodeInfo.latestSolidSubtangleMilestoneIndex) < milestoneLag &&
      currentNodeInfo.neighbors >= minNeighbors
    ) {
      status = chalk.green('✓');
    } else {
      status = chalk.yellow(`${currentNodeInfo.latestSolidSubtangleMilestoneIndex}/${currentNodeInfo.latestMilestoneIndex}`);
    }
  }
  const newDelimiter = `iota (${iotajs.host}:${iotajs.port} ${status})$ `;

  if (newDelimiter !== vorpal.ui.delimiter()) {
    vorpal.delimiter(newDelimiter);
    vorpal.ui.delimiter(newDelimiter);
  }
};

const refreshServerInfo = () => {
  iotajs.api.getNodeInfo((err, nodeInfo) => {
    if (err) {
      currentNodeInfo = undefined;
      return;
    }

    currentNodeInfo = nodeInfo;
    setDelimiter();
  });
};

vorpal
  .command('api', 'Sends an arbitrary command to the node')
  .action(function(args, callback) {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    return this.prompt({
      type: 'input',
      name: 'commandString',
      default: '',
      message: 'Enter the command JSON: ',
    }, result => {
      if (result.continue) {
        return callback();
      }

      let command;
      try {
        command = JSON5.parse(result.commandString);
      } catch (err) {
        vorpal.log(chalk.red(`Invalid JSON: ${err}`));
        return callback();
      }

      iotajs.api.sendCommand(command, (err, success) => {
        if (err) {
          vorpal.log(chalk.red(err));
          return callback();
        }

        vorpal.log(JSON.stringify(success, null, 2));
        callback();
      });
    });
  });

vorpal
  .command('address', 'Generates an address.')
  .action(function(args, callback) {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    if (!seed) {
      vorpal.log(chalk.red('Please set a seed first with the "seed" command.'));
      return callback();
    }

    vorpal.log('One minute while we generate the address.');

    iotajs.api.getNewAddress(seed, (err, address) => {
      if (err) {
        vorpal.log(chalk.red(err));
        return callback();
      }

      const addressWithChecksum = iotajs.utils.addChecksum(address);
      vorpal.log(`The address is ${chalk.yellow(addressWithChecksum)}`);
      vorpal.log('Now we will register that address into the iota tangle.  One moment.');

      const transfers = [{
        address,
        value: 0,
        message: '',
        tag: ''
      }];

      iotajs.api.sendTransfer(seed, depth, minWeightMagnitude, transfers, (err) => {
        if (err) {
          vorpal.log(chalk.red(err));
        }
        vorpal.log('Done.  Your address is ready to use.');
        callback();
      });
    });
  });


vorpal
  .command('balance', 'Gets balance for current seed')
  .action((args, callback) => {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    if (!seed) {
      vorpal.log(chalk.red('Please set a seed first with the "seed" command.'));
      return callback();
    }

    vorpal.log('One moment while we collect the data.');

    new Promise((resolve, reject) => {
      iotajs.api.getNewAddress(seed, {returnAll: true}, (err, addresses) => {
        if (err) {
          return reject(err);
        }

        resolve(addresses);
      });
    })
    .then(addresses => new Promise((resolve, reject) => {
      iotajs.api.getBalances(addresses, 100, (err, data) => {
        if (err) {
          return reject(err);
        }

        const balance = data.balances.reduce((prev, curr) => prev + parseInt(curr), 0);
        vorpal.log(`Your current balance is ${chalk.yellow(balance)} iota.`);

        resolve();
      });
    }))
    .catch(err => vorpal.log(chalk.red(err)))
    .finally(callback);
  });

vorpal
  .command('depth <depth>', 'Sets depth.')
  .action((args, callback) => {
    depth = args.depth;
    callback();
  });

vorpal
  .command('healthcheck', 'Looks for any node problems.')
  .alias('health')
  .action((args, callback) => {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    iotajs.api.getNodeInfo((err, data) => {
      if (err) {
        currentNodeInfo = undefined;
        return callback();
      }

      vorpal.log(`Free memory: ${
        data.jreFreeMemory > 500000
          ? chalk.green('✓')
          : chalk.red(data.jreFreeMemory)}`);

      vorpal.log(`Node sync: ${
        Math.abs(data.latestMilestoneIndex - data.latestSolidSubtangleMilestoneIndex) < milestoneLag
          ? chalk.green('✓')
          : chalk.red('out of sync')}`);

      vorpal.log(`Number of neighbors (${minNeighbors}-${maxNeighbors}): ${
        data.neighbors >= minNeighbors && data.neighbors <= maxNeighbors
          ? chalk.green('✓')
          : chalk.red('you need between 4 and 9 neighbors.  You have ${data.neighbors.length}')}`);

      iotajs.api.getNeighbors((err, neighborData) => {
        if (err) {
          vorpal.log(chalk.red(err));
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
  .command('minWeightMagnitude <mwm>', 'Sets minWeightMagnitude.')
  .alias('mwm')
  .action((args, callback) => {
    minWeightMagnitude = args.mwm;
    callback();
  });

vorpal
  .command('neighbors [address]', 'Shows neighbor information.  Address can be a partial match.')
  .action((args, callback) => {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    iotajs.api.getNeighbors((err, data) => {
      if (err) {
        vorpal.log(chalk.red(err));
        return callback();
      }

      vorpal.log(prettyjson.render(data.neighbors.filter(
        n => n.address.indexOf(args.address || '') !== -1
      )));
      callback();
    });
  });

vorpal
  .command('node <address>', 'connects to a new iota node. (ex. 1.2.3.4)')
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
    minWeightMagnitude = 18;
    refreshServerInfo();
    callback();
  });

vorpal
  .command('nodeinfo', 'Shows connected node information.')
  .action((args, callback) => {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    iotajs.api.getNodeInfo((err, data) => {
      if (err) {
        currentNodeInfo = undefined;
        return callback();
      }

      delete data.duration;
      vorpal.log(prettyjson.render(data));
      callback();
    });
  });

vorpal
  .command('seed <seed>', 'Sets your seed/password.')
  .alias('password')
  .action((args, callback) => {
    vorpal.log(`Setting seed to "${args.seed}"`);
    seed = args.seed.toUpperCase().replace(/[^A-Z9]/g, '9');
    while (seed.length < 81) {
      seed += '9';
    }
    if (seed.length > 81) {
      seed = seed.slice(0, 81);
    }

    callback();
  });

vorpal
  .command('transfer <address> <value>', 'Sends iotas to the address')
  .action((args, callback) => {
    if (!currentNodeInfo) {
      vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "node".'));
      return callback();
    }

    if (!seed) {
      vorpal.log(chalk.red('Please set a seed first with the "seed" command.'));
      return callback();
    }

    if (Number.isNaN(args.value) || Math.floor(args.value) !== args.value) {
      vorpal.log(chalk.red('Please supply an integer for the value.'));
      return callback();
    }

    if (parseInt(args.value) === 0) {
      vorpal.log(chalk.red('The value cannot be zero.'));
      return callback();
    }

    if (args.address.length === 90 && !iotajs.utils.isValidChecksum(args.address)) {
      vorpal.log(chalk.red('That address appears malformed.  Please check it.'));
      return callback();
    }

    const address = args.address.length === 81
      ? iotajs.utils.addChecksum(args.address)
      : args.address;

    vorpal.log('One moment while the transfer is made.  This can take a few minutes.');
    const transfers = [{
      address,
      value: parseInt(args.value),
      message: '',
      tag: ''
    }];

    iotajs.api.sendTransfer(seed, depth, minWeightMagnitude, transfers, err => {
      if (err) {
        vorpal.log(chalk.red(err));
      }

      vorpal.log(chalk.green('Transfer complete!'));
      callback();
    });
  });

setDelimiter();
refreshServerInfo();
setInterval(refreshServerInfo, 10 * 1000);

vorpal.show();

// Give the iotajs connection time to settle before processing command line params
// TODO make this more deterministic.  timeouts = ugly
setTimeout(() => {
  vorpal.parse(process.argv);
}, 100);
