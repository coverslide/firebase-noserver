'use strict';

const Firebase = require('firebase');
const firebase  = Firebase.initializeApp({ databaseURL: "https://serverless-test.firebaseio.com"});

const createQueue = require('./index');

const DetailedError = createQueue.DetailedError;

const jobs = {
  ping: () => {return Promise.resolve(Math.random())},
  echo: (client, payload) => {return Promise.resolve(payload)},
  fail: () => {return Promise.reject(new DetailedError('failed', {a:1,b:2}));}
}

const queue = createQueue(firebase, 'clients', 'queues/clients', jobs);

queue.startQueueCleanup(15000, 5000);
queue.startClientCleanup(15000, 5000);

queue.on('request', (args) => console.log('request', args));
queue.on('success', (args) => console.log('success', args));
queue.on('failure', (args) => console.log('failure', args));
queue.on('queueCleanup', (args) => console.log('queueCleanup', args));
queue.on('clientCleanup', (args) => console.log('clientCleanup', args));