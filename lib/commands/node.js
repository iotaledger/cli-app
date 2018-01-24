'use strict';

const chalk = require('chalk');
const config = require('../config');

const setupNodeCommand = (data, iotajs, refreshAccountData, refreshServerInfo, vorpal) => {
  vorpal
    .command('node <address>', 'connects to a new iota node. (ex. 1.2.3.4)')
    .autocomplete({
      data: () => config.get('nodes', ['localhost:12465'])
    })
    .action((args, callback) => {
      if (!args.address) {
        return;
      }

      const defaultProtocol = 'http://';
      const defaultPort = 14265;
      const regex = args.address.indexOf('[') !== -1
        ? /(http[s]?:\/\/)?(\[[\w\d:]+\])(:)?([0-9]*)?/
        : /(http[s]?:\/\/)?([^:]+)(:)?([0-9]*)?/;
      const parts = args.address.match(regex);
      const protocol = parts[1] || defaultProtocol;
      const hostname = parts[2];
      const port = Number(parts[4] || defaultPort);
      if (Number.isNaN(port)) {
        vorpal.log(chalk.red('Port must be a number.  (ex. 1.2.3.4:12465)'));
        return callback();
      }

      const host = `${protocol}${hostname}`;

      iotajs.changeNode({host, port});
      if (host !== 'http://localhost') {
        vorpal.log('This may take a few seconds for a remote node.  Did you turn on remote access?');
      }

      data.minWeightMagnitude = 14;
      refreshAccountData();
      refreshServerInfo();
      callback();
    });
};

module.exports = setupNodeCommand;
