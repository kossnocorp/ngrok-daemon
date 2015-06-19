var Tail = require('tail').Tail
var spawn = require('child_process').spawn

module.exports = {
  start: function(port) {
    return new Promise(function(resolve, reject) {
      var log = 'out.log'

      var start = spawn('sh', ['start.sh'], {
        env: { NGROK_DAEMON_PORT: port, NGROK_DAEMON_LOG: log }
      })

      start.stdout.on('data', function(data) {
        var pid = parseInt(data)

        getUrl(log).then(function(url) {
          resolve({ url: url, pid: pid, log: log })
        })
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

