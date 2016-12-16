const chalk = require('chalk');
const IOTA = require('iota.lib.js');
const vorpal = require('vorpal')();

let seed = '';
let serverInfo = undefined;

let iotajs = new IOTA({
    host: 'http://localhost',
    port: 14265
});

const setDelimiter = () => {
    let status = chalk.red('disconnected');
    if (serverInfo) {
        if (Math.abs(serverInfo.latestMilestoneIndex - serverInfo.latestSolidSubtangleMilestoneIndex) < 10) {
            status = chalk.green('✓');
        } else {
            status = chalk.yellow(`${serverInfo.latestSolidSubtangleMilestoneIndex}/${serverInfo.latestMilestoneIndex}`);
        }
    }
    const newDelimiter = `iota (${iotajs.provider} - ${status})$ `;

    if (newDelimiter !== vorpal.ui.delimiter()) {
        vorpal.delimiter(newDelimiter);
        vorpal.ui.delimiter(newDelimiter);
    }
};

const checkServerInfo = () => {
    iotajs.api.getNodeInfo((err, newServerInfo) => {
        if (err) {
            serverInfo = undefined;
            return;
        }

        serverInfo = newServerInfo;
        setDelimiter();
    });
};

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
      checkServerInfo();
      callback();
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

setDelimiter();
checkServerInfo();
setTimeout(checkServerInfo, 10 * 1000);

vorpal.show();
