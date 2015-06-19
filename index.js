var Tail = require('tail').Tail
var spawn = require('child_process').spawn

module.exports = {
  start: function(port) {
    return new Promise(function(resolve, reject) {
      var log = 'out.log'
      var env = { NGROK_DAEMON_PORT: port, NGROK_DAEMON_LOG: log }

      spawn('sh', ['start.sh'], { env: env })
        .stdout.on('data', function(data) {
          var pid = parseInt(data)

          getUrl(log).then(function(url) {
            resolve({ url: url, pid: pid, log: log })
          })
        })
    })
  },

  stop: function(pid) {
    return new Promise(function(resolve, reject) {
      spawn('kill', [pid]).on('close', resolve)
    })
  },

  isRunning: function(pid) {
    return new Promise(function(resolve, reject) {
      ps = spawn('ps', ['-p', pid])

      ps.stderr.on('data', function(data) { reject(data.toString()) })

      ps.stdout.on('data', function(data) {
        var isRunning = data.toString().match(pid)
        if (isRunning) {
          resolve()
        } else {
          reject()
        }
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

    tail.watch()
  })
}

