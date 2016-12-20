'use strict';

const { isMissingData } = require('./validations');
const prettyjson = require('prettyjson');

const setupNodeInfoCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('nodeinfo', 'Shows connected node information.')
    .action((args, callback) => {
      if (isMissingData(['node'])) {
        return callback();
      }

      iotajs.api.getNodeInfo((err, data) => {
        if (err) {
          data.currentNodeInfo = undefined;
          return callback();
        }

        delete data.duration;
        vorpal.log(prettyjson.render(data));
        callback();
      });
    });

};

module.exports = setupNodeInfoCommand;
