# ngrok-daemon

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
When ngrok-daemon fails to perform some action, it returns.

### `start`

Starts ngrok on given port and returns `tunnel` object:

``` js
var ngrok = require('ngrok-daemon')

ngrok.start(4000) // Port
  .then(function(tunnel) {
    // Tunnel has three propeties:
    // - url - URL to the started tunnel
    // - pid - process id of ngrok (PID)
    // - log - path to ngrok log is temporary directory
  })
  .reject(function() {
    // Failed to start ngrok on given port (eg ngrok is not installed)
  })
```

It's possible to specify custom shell script that will start ngrok.
Here is default one:

``` shell
ngrok -log=stdout $NGROK_DAEMON_PORT > $NGROK_DAEMON_LOG &
echo $!
```

To provide custom shell script, pass source string as an option:

``` js
ngrok.start(4000, { shell: 'ngrok -log=stdout $NGROK_DAEMON_PORT > $NGROK_DAEMON_LOG &\necho $!' })
```

**Important**: shell script must echo PID, otherwise app will crash.

### `stop`

Starts ngrok on given port and returns `tunnel` object:

``` js
ngrok.stop(tunnel.pid)
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

## Tests

To run the tests you need:

1. Internet connection,
2. free port `4999`,
3. `ngrok` binary avaliable in `$PATH`,

To start the tests in "watch" (autotests) mode:

```
npm start
```

**Warning**: `killall ngrok` will be invoked after each `it` statement,
so don't be surprised when your own ngrok tunnel will be killed.

