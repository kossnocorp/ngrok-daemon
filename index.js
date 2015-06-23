var Tail = require('tail').Tail
var spawn = require('child_process').spawn
var temp = require('temp')
var path = require('path')

module.exports = {
  start: function(portOrShell, options) {
    var port
    var shell
    if (typeof portOrShell == 'number') {
      port = portOrShell
    } else {
      shell = portOrShell
    }

    options = options || {}

    return new Promise(function(resolve, reject) {
      getTempFile()
        .then(function(log) {
          var shellString = (shell || 'ngrok -log=stdout ' + port) + ' > ' + log + ' &\necho $!'
          var start = spawn('sh', ['-c', shellString], {
            cwd: options.cwd || process.cwd()
          })

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

  stop: function(pidOrShell, options) {
    var pid
    var shell
    if (typeof pidOrShell == 'number') {
      pid = pidOrShell
    } else {
      shell = pidOrShell
    }

    options = options || {}

    return new Promise(function(resolve, reject) {
      var shellString = shell || 'kill ' + pid
      var stop = spawn('sh', ['-c', shellString], {
        cwd: options.cwd || process.cwd()
      })

      stop.on('close', resolve)
    })
  },

  isRunning: function(pidOrShell, options) {
    var pid
    var shell
    if (typeof pidOrShell == 'number') {
      pid = pidOrShell
    } else {
      shell = pidOrShell
    }

    options = options || {}

    return new Promise(function(resolve, reject) {
      var shellString = shell || 'kill -0 ' + pid
      var status = spawn('sh', ['-c', shellString], {
        cwd: options.cwd || process.cwd()
      })

      status.on('exit', function(status) {
        status == 0 ? resolve() : reject()
      })
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

