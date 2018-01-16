'use strict';

const chalk = require('chalk');
const fetch = require('node-fetch');
const isMissingData = require('./validations').isMissingData;
const Promise = require('bluebird'); // For older node systems that don't have promise built in.

let elapsedInterval;

const setupClaimCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('claim <oldSeed>', 'Claim any iotas in the old seed and send them to the current seed')
    .action((args, callback) => {
      if (isMissingData(['node', 'seed'])) {
        return callback();
      }

      const oldSeed = args.oldSeed.toUpperCase().replace(/[^A-Z9]/ig, '9').slice(0, 81);

      vorpal.log('One moment while we gather data.');
      const start = Date.now();
      elapsedInterval = setInterval(() => {
        process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
      });

      new Promise((resolve, reject) => {
        iotajs.api.getNewAddress(data.seed, (err, newAddress) => {
          if (err) {
            return reject(err);
          }
          resolve(newAddress);
        });
      })
      .then(newAddress => fetch(
          `https://service.iotatoken.com/upgrade?seed=${oldSeed}&address=${newAddress}`,
          { timeout: 10 * 60 * 1000 }
        )
        .then(res => res.text())
      )
      .then(body => new Promise((resolve, reject) => {
        if (elapsedInterval) {
          if (body === 'The seed provided by you contains 0 iotas') {
            reject('The seed provided by you contains 0 iotas.');
            return;
          }

          const match = body.match(/To claim these iotas send the following message to address \"([A-Z9]+)\": ([A-Z9]+)\r\n\r\nThe message must have tag \"([A-Z9]+)\"/);
          if (!match || !match[1] || !match[2] || !match[3]) {
            reject('There was an error in the reply data.');
            return;
          }

          const iotaAmount = body.match(/The seed provided by you contains ([0-9]+) iotas/i);
          if (!iotaAmount) {
            reject('There was an error in the reply data.');
            return;
          }

          vorpal.log(`Your old seed contains ${iotaAmount[1]} iotas.`);
          resolve({
            address: match[1],
            message: match[2],
            tag: match[3]
          });
        }
      }))
      .then(params => new Promise((resolve, reject) => {
        vorpal.log(`To claim the iotas we'll send a transfer to ${params.address} with the message ${params.message} and tag ${params.tag}`);
        iotajs.api.sendTransfer(
          data.seed,
          data.depth,
          data.minWeightMagnitude,
          [{
            address: params.address,
            value: 0,
            message: params.message,
            tag: params.tag
          }],
          (err) => {
            if (err) {
              return reject(err);
            }

            if (elapsedInterval) {
              clearInterval(elapsedInterval);
              vorpal.log(chalk.green('The transfer is on the way.\n'));
            }
            resolve();
          });
      }))

      .catch(err => {
        clearInterval(elapsedInterval);
        vorpal.log(chalk.red(err), '\n');
      })

      .finally(callback);
    })

    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle(() => {});
      vorpal.log(chalk.red('cancelled\n'));
    });
};

module.exports = setupClaimCommand;
