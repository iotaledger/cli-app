'use strict';

const setupMWMCommand = (data, vorpal) => {
  vorpal
    .command('minWeightMagnitude <mwm>', 'Sets minWeightMagnitude.')
    .alias('mwm')
    .action((args, callback) => {
      data.minWeightMagnitude = args.mwm;
      callback();
    });
};

module.exports = setupMWMCommand;
