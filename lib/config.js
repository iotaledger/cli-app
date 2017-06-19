'use strict';

const fs = require('fs');
const getAt = require('lodash/get');
const os = require('os');
const path = require('path');
const Promise = require('bluebird');
const setAt = require('lodash/set');

const homedir = os.homedir();
const iotaDir = path.join(homedir, '.iota');
const iotaConfig = path.join(iotaDir, 'config.json');

const setupConfigFile = new Promise((resolve, reject) => {
  fs.access(iotaDir, fs.constants.W_OK, err => {
    if (!err) {
      return resolve();
    }

    return fs.mkdir(iotaDir, err2 => {
      if (err2) {
        return reject(err2);
      }
      resolve();
    });
  });
})
.then(() => new Promise((resolve, reject) => {
  fs.access(iotaConfig, fs.constants.W_OK, err => {
    if (err) {
      return fs.writeFile(iotaConfig, '{}', err2 => {
        if (err2) {
          return reject(err2);
        }
        resolve();
      });
    }

    resolve();
  });
}));

const get = (path, defaultValue) => load()
  .then(configData => getAt(configData, path, defaultValue));

const load = () => setupConfigFile
  .then(() => new Promise((resolve, reject) => {
    fs.readFile(iotaConfig, (err, contents) => {
      if (err) {
        return reject(err);
      }

      try {
        const configData = JSON.parse(contents);
        resolve(configData);
      } catch (err2) {
        if (err) {
          return reject(err2);
        }
      }
    });
  }));

const set = (path, value) => load()
    .then(configData => {
      if (!path || !value) {
        return configData;
      }

      setAt(configData, path, value);
      return configData;
    })
    .then(configData => new Promise((resolve, reject) => {
      fs.writeFile(iotaConfig, JSON.stringify(configData), err => {
        if (err) {
          return reject(err);
        }
        resolve(configData);
      });
    }));

module.exports = {
  get,
  set
};
