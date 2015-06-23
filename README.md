# ngrok-daemon [![Build Status](https://travis-ci.org/kossnocorp/ngrok-daemon.svg?branch=master)](https://travis-ci.org/kossnocorp/ngrok-daemon) [![npm version](https://badge.fury.io/js/ngrok-daemon.svg)](http://badge.fury.io/js/ngrok-daemon)

Very basic Node.js [ngrok](https://ngrok.com) wrapper. Unline [ngrok](https://www.npmjs.com/package/ngrok)
npm package, ngrok-daemon do not use `child_process` so:

1. ngrok tunnel won't be killed automatically,
2. logs are streamed to file,
3. you have the ngrok PID.

It's really basic so you will get only `start`, `stop` and `isRunning` functions.

## Installation

To install ngrok-daemon you need to run `npm install`:

```
npm install ngrok-daemon --save
```

ngrok-daemons uses native `Promise` object,
so it [won't run on outdated Node.js](http://stackoverflow.com/questions/21564993/native-support-for-promises-in-node-js).

## API

API is small and simple. Every function returns [`Promise`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).
When ngrok-daemon fails to perform some action, it rejects the promise.

### `start`

Start ngrok on given port and get `tunnel` object:

``` js
var ngrok = require('ngrok-daemon')

ngrok.start(4000) // Port
  .then(function(tunnel) {
    // Tunnel has three propeties:
    // - url - URL to the started tunnel
    // - pid - process id of ngrok (PID)
    // - log - path to ngrok log in temporary directory
  })
  .catch(function() {
    // Failed to start ngrok on given port (eg ngrok is not installed)
  })
```

**Important**: Node.js process won't exit automatically after spawning
background process, so if you need to stop it, call `process.exit` once
you got a tunnel data.

It's possible to specify custom shell script that will start ngrok.
To do it, pass source string as an option:

``` js
ngrok.start('ngrok -log=stdout 4000')
```

### `stop`

Stop ngrok process using the PID:

``` js
ngrok.stop(tunnel.pid)
```

It's possible to specify custom shell script that will stop ngrok.
To do it, pass source string as the first argument:

``` js
ngrok.stop('kill ' + tunnel.pid)
```

### `isRunning`

Resolves promise if it is running and rejects if isn't:

``` js
ngrok.isRunning(tunnel.pid)
  .then(function() {
    // ngrok is running
  })
  .catch(function() {
    // Nope
  })
```

It's possible to specify custom shell script that will check if ngrok
is running. To do it, pass source string as the first argument:

``` js
ngrok.isRunning('kill -0 ' + tunnel.pid)
```

**Important**: empty stdout will be treated as "not running" and vice versa.

## Tests

To run the tests you need:

1. Internet connection,
2. free port `4999`,
3. `ngrok` binary avaliable in `$PATH`,

To start the tests in "watch" (autotests) mode:

```
npm test
```

**Warning**: `killall ngrok` will be invoked after each `it` statement,
so don't be surprised when your own ngrok tunnel will be killed.

## License

ngrok-daemon is released under the [MIT License](./LICENSE.md).

