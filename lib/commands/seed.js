'use strict';

const setupSeedCommand = (data, vorpal) => {
  vorpal
    .command('seed <seed>', 'Sets your seed/password.')
    .alias('password')
    .action((args, callback) => {
      vorpal.log(`Setting seed to "${args.seed}"`);
      data.seed = args.seed.toUpperCase().replace(/[^A-Z9]/g, '9');
      while (data.seed.length < 81) {
        data.seed += '9';
      }
      if (data.seed.length > 81) {
        data.seed = data.seed.slice(0, 81);
      }

      callback();
    });
};

module.exports = setupSeedCommand;
