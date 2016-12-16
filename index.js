const chalk = require('chalk');
const IOTA = require('iota.lib.js');
const prettyjson = require('prettyjson');
const vorpal = require('vorpal')();

let seed = '';
let currentServerInfo = undefined;

let iotajs = new IOTA({
  host: 'http://localhost',
  port: 14265
});

const setDelimiter = () => {
  let status = chalk.red('disconnected');
  if (currentServerInfo) {
    if (Math.abs(currentServerInfo.latestMilestoneIndex - currentServerInfo.latestSolidSubtangleMilestoneIndex) < 10) {
      status = chalk.green('✓');
    } else {
      status = chalk.yellow(`${currentServerInfo.latestSolidSubtangleMilestoneIndex}/${currentServerInfo.latestMilestoneIndex}`);
    }
  }
  const newDelimiter = `iota (${iotajs.provider} - ${status})$ `;

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
    .command('neighbors', 'Shows neighbor information.')
    .action((args, callback) => {
      if (!currentServerInfo) {
        vorpal.log(chalk.red('It looks like you are not connected to an iota node.  Try "server".'));
        return callback();
      }

      iotajs.api.getNeighbors((err, neighbors) => {
        if (err) {
          return callback();
        }

        delete neighbors.duration;
        vorpal.log(prettyjson.render(neighbors));
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

      iotajs.api.getNodeInfo((err, serverInfo) => {
        if (err) {
          currentServerInfo = undefined;
          return callback();
        }

        delete serverInfo.duration;
        vorpal.log(prettyjson.render(serverInfo));
        callback();
      });
    });

vorpal
    .command('seed <seed>', 'Sets your seed/password.')
    .action((args, callback) => {
      seed = args.seed.toUpperCase().replace(/[^A-Z9]/g, '9');
      while (seed.length < 81) {
        seed += '9';
      }
      if (seed.length > 81) {
        seed = seed.slice(0, 81);
      }
      vorpal.log(`Setting seed to ${seed}`);
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
    refreshServerInfo();
    callback();
  });

setDelimiter();
refreshServerInfo();
setInterval(refreshServerInfo, 10 * 1000);

vorpal.show();
