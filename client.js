'use strict';

if (typeof Promise == 'undefined' || typeof Promise.resolve == 'undefined') {
  throw new Error('ES6 Promises are required to use firebase-serverless');
}

var Firebase = require('firebase');

var DEFAULT_TIMEOUT = 5000;

function createClient (firebase, clientPath, queuePath, options) {
  if (!options) {
    options = {};
  }
  return function (type, payload) {
    if (!payload) {
      payload = {};
    }
    var auth, clientRef, clientId, client;
    return Promise.resolve().then(function () {
      auth = firebase.getAuth();
      return firebase.child(clientPath).push({created: Firebase.ServerValue.TIMESTAMP, auth: auth});
    }).then(function (clientSnap) {
      clientId = clientSnap.key();
      clientRef = firebase.child(clientPath + '/' + clientId);
      return clientRef.once('value');
    }).then(function (clientSnap) {
      client = clientSnap.val();
      return new Promise(function (resolve, reject) {
        var responseRef = clientRef.child('response');
        var timeout = setTimeout(() => {
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
            reject(new Error(response._error));
          }
          resolve(response);
        });

        const data = {payload: payload, clientId: clientId, type: type, created: Firebase.ServerValue.TIMESTAMP};

        firebase.child(queuePath + '/tasks').push(data);
      });
    });
  }
}

module.exports = createClient;
