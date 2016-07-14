'use strict';

const Firebase = require('firebase');
const firebase  = new Firebase("https://serverless-test.firebaseio.com");

const createClient = require('./client');

const createRequest = createClient(firebase, 'clients', 'queues/clients');

Promise.all([
  createRequest('ping').then(console.log).catch(console.trace),
  createRequest('echo', Math.random()).then(console.log).catch(console.trace),
  createRequest('fail').then(console.log).catch(console.trace),
  createRequest('noexist').then(console.log).catch(console.trace),
]).then(process.exit);