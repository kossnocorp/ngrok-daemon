var assert = require('power-assert')
var express = require('express')
var fetch = require('node-fetch')
var shell = require('shelljs')
var ngrok = require('./')

var SERVER_PORT = 4999

describe('ngrok-daemon', function() {
  var server
  before(function(done) {
    server = express()
      .get('/', function(req, res) { res.send('Hello cruel world!') })
      .listen(SERVER_PORT, done)
  })

  after(function() {
    server.close()
  })

  afterEach(function() {
    shell.exec('killall ngrok')
  })

  describe('start', function() {
    var start = ngrok.start

    it('starts ngrok and pass the URL', function() {
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          assert(typeof tunnel.url == 'string', 'URL is not a string')
          return tunnel
        })
        .then(function(tunnel) { return fetch(tunnel.url) })
        .then(function(res) { return res.text() })
        .then(function(text) {
          assert.equal(
            text, 'Hello cruel world!', 'Got unexpected response text'
          )
        })
    })

    it('passes the tunnel PID', function() {
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          var pid = tunnel.pid
          assert(typeof pid == 'number', 'PID is not a number')
          assert(
            shell.exec('ps -p ' + pid + ' | grep ' + pid, { silent: true }).output != '',
            'PID is invalid or ngrok is not started'
          )
        })
    })

    it('passes the ngrok log file path', function() {
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          var log = tunnel.log
          assert(typeof log == 'string', 'log is not a string')
          assert(
            shell.exec('cat ' + log + ' | grep ' + tunnel.url, { silent: true }).output != '',
            'Log path is invalid'
          )
        })
    })
  })
})

