'use strict';

if (typeof Promise == 'undefined' || typeof Promise.resolve == 'undefined') {
  throw new Error('ES6 Promises are required to use firebase-noserver');
}

var DetailedError = require('./detailedError');

var DEFAULT_TIMEOUT = 5000;

function createClient (firebase, clientPath, queuePath, options) {
  if (!options) {
    options = {};
  }
  return function (type, payload) {
    var database = firebase.database().ref();
    if (!payload) {
      payload = {};
    }
    var auth, clientRef, clientId, client;
    return Promise.resolve().then(function () {
      auth = firebase.auth().currentUser;
      return database.child(clientPath).push({ created: Date.now(), auth: auth ? {uid: auth.uid, isAnonymous: auth.isAnonymous} : null });
    }).then(function (clientSnap) {
      clientId = clientSnap.key;
      clientRef = database.child(clientPath + '/' + clientId);
      return clientRef.once('value');
    }).then(function (clientSnap) {
      client = clientSnap.val();
      return new Promise(function (resolve, reject) {
        var responseRef = clientRef.child('response');
        var timeout = setTimeout(function () {
          responseRef.off('value');
          clientRef.remove();
          reject('Client timed out');
        }, payload._timeout || options.timeout || DEFAULT_TIMEOUT);
        responseRef.on('value', function (responseSnap) {
          var response = responseSnap.val();
          // skip initial 'value' event, must always return a value, false if no value
          if (response == null) {
            return;
          }
          clearTimeout(timeout);
          responseRef.off('value');
          clientRef.remove();
          if (response._error) {
            if (response._errorDetails) {
              reject(new DetailedError(response._error, response._errorDetails));
            } else {
              reject(new Error(response._error));
            }
          }
          resolve(response);
        });

        var data = {payload: payload, clientId: clientId, type: type, created: Date.now()};

        database.child(queuePath + '/tasks').push(data);
      });
    });
  }
}

module.exports = createClient;

createClient.DetailedError = DetailedError;
