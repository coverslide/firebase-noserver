firebase-noserver
===================

A serverless request / response architecture based on firebase and firebase
queues. Firebase is an excellent platform for building most data driven
applications, and for the most part you do not need to expose a backend
and have to worry about the security of your app. However, there are some
actions that require a request-response type of architecture. While you can
have event listeners for when data changes, that approach can gets rather
complicated, and it doesn't take into account those changes that should only
happen in secured data where a user doesn't have access, or actions that have
no side effects in the data at all. **Firebase-noserver** does the dirty work
for you to handle notification of when an action completes, getting a response
in plain JSON, and error handling when an action fails.

Requirements
============

* [node.js](https://nodejs.org)
* [firebase](https://firebase.google.com)
* [firebase-queue](http://npm.im/firebase-queue)

Installation
============

```
npm install --save firebase-noserver
```

Quick Start
===========

For use with version 3.x of the firebase node library, use the 3.x branch, or for version 2.x, use the 2.x branch.

For the queue side:

```
const firebase = require('firebase');
const createQueue = require('firebase-noserver');

firebase.initializeApp({...});

// all methods in jobMap must return promises
const jobMap = {
  echo: (client, val) => Promise.resolve(val),
  ping: (client) => Promise.resolve(Date.now()),
  fail: (client) => Promise.reject('Always fails'),
  somethingComplicated: (client, payload, firebase) => {
    const auth = client.auth;
    const userId = auth && auth.uid;
    
    const result = ... // do your magic here

    return Promise.resolve(result);
  }
};

const options = {}; // nothing here, yet

const queue = createQueue(firebase, 'clients', 'queues/clients', jobMap, options);
```

And for the client side:
```
const firebase = require('firebase');
const createClient = require('firebase-noserver/client');

firebase.initializeApp({...});

const options = { timeout: 1000 };

const createRequest = createClient(firebase, 'clients', 'queues/clients', options);

createRequest('echo', 'blah').then(val => { // should be 'blah'
  return createRequest('ping');
}).then(timestamp => { // should be the timestamp on the queue
  return createRequest('fail');
}).then(val => { // this shouldn't be reached
}).catch(err => { // should be 'Always fails'
  console.error(err);
};
```
