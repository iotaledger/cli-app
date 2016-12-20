'use strict';

const setupDepthCommand = (data, vorpal) => {
  vorpal
    .command('depth <depth>', 'Sets depth.')
    .action((args, callback) => {
      data.depth = args.depth;
      callback();
    });
};

module.exports = setupDepthCommand;
