'use strict';

const Firebase = require('firebase');
const firebase  = Firebase.initializeApp({databaseURL: "https://serverless-test.firebaseio.com"});

const createClient = require('./client');

const createRequest = createClient(firebase, 'clients', 'queues/clients');

const trace = console.trace.bind(console);
const log = console.log.bind(console)

//firebase.auth().signInAnonymously().then(() => 
Promise.resolve().then(() => 
Promise.all([
  createRequest('ping').then(log).catch(trace),
  createRequest('echo', Math.random()).then(log).catch(trace),
  createRequest('fail').then(log).catch(trace),
  createRequest('noexist').then(log).catch(trace),
])
).then(process.exit);