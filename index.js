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
        var tail = new Tail(log, '\n', {}, true /* read from beginning */)

        tail.on('line', function(line) {
          var captures = line.match(/Tunnel established at (.+)/)
          if (captures) {
            tail.unwatch()
            resolve({ url: captures[1], pid: pid, log: log })
          }
        })

        tail.watch()
      })
    })
  }
}

