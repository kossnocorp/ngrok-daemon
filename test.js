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
    shell.exec('killall ngrok', { silent: true })
  })

  describe('start', function() {
    it('starts ngrok and pass the URL', function() {
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          assert(typeof tunnel.url == 'string')
          return tunnel
        })
        .then(function(tunnel) { return fetch(tunnel.url) })
        .then(function(res) { return res.text() })
        .then(function(responseText) {
          assert(responseText == 'Hello cruel world!')
        })
    })

    it('passes the tunnel PID', function() {
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          var pid = tunnel.pid
          assert(typeof pid == 'number')
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
          assert(typeof log == 'string')
          assert(
            shell.exec('cat ' + log + ' | grep ' + tunnel.url, { silent: true }).output != '',
            'Log path is invalid'
          )
        })
    })

    it('allows to pass custom shell script', function() {
      return ngrok
        .start('ngrok -log=stdout ' + SERVER_PORT)
        .then(function(tunnel) { return fetch(tunnel.url) })
        .then(function(res) { return res.text() })
        .then(function(responseText) {
          assert(responseText == 'Hello cruel world!')
        })
    })
  })

  describe('stop', function() {
    it('stops ngrok by passed PID', function() {
      var pid
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          return ngrok.stop(pid)
            .then(function() {
              assert(
                shell.exec('ps -p ' + tunnel.pid + ' | grep ' + pid, { silent: true }).output == '',
                'ngrok is still running'
              )
            })
        })
    })

    it('passes the exit code', function() {
      return ngrok.stop(9999999999999)
        .then(function(code) {
          assert(typeof code == 'number')
          assert(code != 0)
        })
    })

    it('allows to pass custom shell script', function() {
      return ngrok
        .start(SERVER_PORT)
        .then(function(tunnel) {
          return ngrok
            .stop('kill ' + tunnel.pid)
            .then(function() {
              assert(
                shell.exec('ps -p ' + tunnel.pid + ' | grep ' + tunnel.pid, { silent: true }).output == '',
                'ngrok is still running'
              )
            })
        })
    })
  })

  describe('isRunning', function() {
    context('when PID is wrong', function() {
      it('returns false', function(done) {
        return ngrok.isRunning(9999999999999)
          .then(assert.bind(null, false, 'Promise should not be resolved'))
          .catch(function() { done() })
      })
    })

    context('when process is not running', function() {
      it('returns false', function(done) {
        return ngrok.isRunning(0)
          .then(assert.bind(null, false, 'Promise should not be resolved'))
          .catch(function() { done() })
      })
    })

    context('when it is running', function() {
      it('returns true', function(done) {
        return ngrok
          .start(SERVER_PORT)
          .then(function(tunnel) {
            return ngrok.isRunning(tunnel.pid)
              .then(done)
              .catch(assert.bind(null, false, 'Promise must not be rejected'))
          })
      })
    })

    describe('custom shell script', function() {
      context('when shell script puts something to stdout', function() {
        it('resolves the promise', function(done) {
          return ngrok.isRunning('echo ok')
            .then(done)
            .catch(assert.bind(null, false, 'Promise must not be rejected'))
        })

        it('rejects the promise', function(done) {
          return ngrok.isRunning('')
            .then(assert.bind(null, false, 'Promise must not be resolved'))
            .catch(done)
        })
      })
    })
  })
})

