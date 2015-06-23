var Tail = require('tail').Tail
var spawn = require('child_process').spawn
var temp = require('temp')
var path = require('path')

module.exports = {
  start: function(port, options) {
    options = options || {}

    return new Promise(function(resolve, reject) {
      getTempFile()
        .then(function(log) {
          var env = { NGROK_DAEMON_PORT: port, NGROK_DAEMON_LOG: log }
          var args
          if (options.shell) {
            args = ['-c', options.shell]
          } else {
            args = [path.join(__dirname, 'scripts', 'start.sh')]
          }
          var start = spawn('sh', args, { env: env })

          start.stdout.on('data', function(data) {
            var pid = parseInt(data)

            getUrl(log)
              .then(function(url) {
                resolve({ url: url, pid: pid, log: log })
              })
              .catch(reject)
          })

          start.stderr.on('data', function(data) { reject(data.toString()) })
        })
    })
  },

  stop: function(pid, options) {
    options = options || {}

    return new Promise(function(resolve, reject) {
      var env = { NGROK_PID: pid }
      var args
      if (options.shell) {
        args = ['-c', options.shell]
      } else {
        args = [path.join(__dirname, 'scripts', 'stop.sh')]
      }
      var stop = spawn('sh', args, { env: env })

      stop.on('close', resolve)
    })
  },

  isRunning: function(pid, options) {
    options = options || {}

    return new Promise(function(resolve, reject) {
      var env = { NGROK_PID: pid }
      var args
      if (options.shell) {
        args = ['-c', options.shell]
      } else {
        args = [path.join(__dirname, 'scripts', 'is_running.sh')]
      }
      var start = spawn('sh', args, { env: env })

      start.stdout.on('data', function(data) {
        var isRunning = data != ''
        if (isRunning) {
          resolve()
        } else {
          reject()
        }
      })

      start.stderr.on('data', function(data) { reject(data.toString()) })
    })
  }
}

function getUrl(log) {
  return new Promise(function(resolve, reject) {
    var tail = new Tail(log, '\n', {}, true /* read from beginning */)

    tail.on('line', function(line) {
      var captures = line.match(/Tunnel established at (.+)/)

      if (captures) {
        tail.unwatch()
        resolve(captures[1])
      }
    })

    tail.on('error', reject)

    tail.watch()
  })
}

function getTempFile() {
  return new Promise(function(resolve, reject) {
    var log = temp.path({ prefix: 'ngrok-daemon-', suffix: '.log' })
    spawn('touch', [log]).on('close', function() { resolve(log) })
  })
}

