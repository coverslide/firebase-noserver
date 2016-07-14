'use strict';

if (typeof Promise == 'undefined' || typeof Promise.resolve == 'undefined') {
  throw new Error('ES6 Promises are required to use firebase-serverless');
}

var EventEmitter = require('events').EventEmitter;
var Queue = require('firebase-queue');

function createQueue (firebase, clientPath, queuePath, jobMap, options) {
  var queue = new EventEmitter();
  queue.queue = new Queue(firebase.child(queuePath), function (data, progress, jobSuccess, jobFailure) {
    var auth, clientRef, clientId, responseRef, client, response, job;
    if (!data.clientId) {
      return jobFailure('clientId required');
    }
    clientRef = firebase.child(clientPath + '/' + data.clientId);
    responseRef = clientRef.child('response');

    return Promise.resolve().then(function () {
      return clientRef.once('value');
    }).then(function (clientSnap) {
      client = clientSnap.val();
      queue.emit('request', {client: client, data: data});
      if (!client) {
        return jobFailure('Client not connected');
      }
      job = jobMap[data.type];
      if (!job || typeof job != 'function') {
        return Promise.reject('Unrecognized job type: ' + data.type);
      }
      return job(client, data.payload);
    }).then(function (responseData) {
      response = responseData || false;
      return responseRef.set(response);
    }).then(function () {
      jobSuccess(response);
      queue.emit('success', {client: client, data: data, response: response});
    }).catch(function (err) {
      response = {_error: err.message || err};
      responseRef.set(response);
      jobFailure(err);
      queue.emit('failure', {client: client, data: data, response: response});
    });
  });

  queue.queueCleanup = function (threshold) {
    return firebase.child(queuePath + '/tasks').orderByChild('created').endAt(Date.now() - threshold).once('value').then(function (snap) {
      const values = snap.val();
      queue.emit('queueCleanup', values);
      return Promise.all(Object.keys(values).map(key => firebase.child(queuePath + '/tasks/' + key).remove()));
    });
  }

  queue.startQueueCleanup = function (threshold, interval) {
    if (queue._queueCleanupInterval) {
      queue.stopQueueCleanup();
    }
    queue._queueCleanupInterval = setInterval(queue.queueCleanup, interval, threshold);
  }

  queue.stopQueueCleanup = function () {
    if (queue._queueCleanupInterval) {
      clearInterval(queue._queueCleanupInterval);
      queue._queueCleanupInterval = null;
    }
  }

  queue.clientCleanup = function (threshold) {
    return firebase.child(clientPath).orderByChild('created').endAt(Date.now() - threshold).once('value').then(function (snap) {
      const values = snap.val();
      queue.emit('clientCleanup', values);
      return Promise.all(Object.keys(values).map(key => firebase.child(clientPath + '/' + key).remove()));
    });
  }

  queue.startClientCleanup = function (threshold, interval) {
    if (queue._clientCleanupInterval) {
      queue.stopClientCleanup();
    }
    queue._clientCleanupInterval = setInterval(queue.clientCleanup, interval, threshold);
  }

  queue.stopClientCleanup = function () {
    if (queue._clientCleanupInterval) {
      clearInterval(queue._clientCleanupInterval);
      queue._clientCleanupInterval = null;
    }
  }

  return queue;
}

module.exports = createQueue;
