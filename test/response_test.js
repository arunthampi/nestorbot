var qs = require('qs');
var chai = require('chai');
var sinon = require('sinon');

var User = require('../src/user');
var Robot = require('../src/robot');
var TextMessage = require('../src/message').TextMessage;
var Response = require('../src/response');

chai.use(require('sinon-chai'));
expect = chai.expect;

describe('Response', function() {
  var robot, adapter;

  beforeEach(function() {
    this.user = new User('UDEADBEEF1',
    {
      name: 'nestorbottester',
      room: 'CDEADBEEF1'
    });
    this.robot = new Robot('TDEADBEEF', 'UNESTORBOT1', false);
    this.message = new TextMessage(this.user, 'message123');
    this.response = new Response(this.robot, this.message);
  });

  describe('Public API', function() {
    describe('send', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        it('should buffer responses in robot.toSend', function() {
          res = this.response.send('hello');
          expect(this.robot.toSend).to.eql([{strings:['hello'], reply: false}]);
          expect(res).to.be.true;
        });
      });

      context.skip('when not in debug mode', function() {
        var scope;

        beforeEach(function() {
          port = 55999;
          server = fork(__dirname + '/fake-server');

          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
          process.env.__NESTOR_API_HOST = 'http://localhost:' + port;
        });

        it('should make a request to the Nestor API to send a message back to the user', function(done) {
          var _this = this;

          server.on('message', function(m) {
            if(m === 'started') {
              res = _this.response.send('hello');
              expect(res).to.be.true;
              server.send(JSON.stringify({command: 'stop'}));
            } else {
              done();
            }
          });

          server.send(JSON.stringify({command: 'start', port: port, url: '/teams/TDEADBEEF/messages', payload: JSON.stringify({ok: true}), statusCode: 202}));
        });
      });
    });

    describe('reply', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        it('should buffer responses in robot.toSend', function() {
          res = this.response.reply('hello');
          expect(this.robot.toSend).to.eql([{strings:['hello'], reply: true}]);
          expect(res).to.be.true;
        });
      });

      context.skip('when not in debug mode', function() {
        var scope, port, server;

        beforeEach(function() {
          port = 55999;
          server = fork(__dirname + '/fake-server');

          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
          process.env.__NESTOR_API_HOST = 'http://localhost:' + port;
        });

        it('should make a request to the Nestor API to send a message back to the user', function(done) {
          var _this = this;

          server.on('message', function(m) {
            if(m === 'started') {
              res = _this.response.reply('hello');
              expect(res).to.be.true;
              server.send(JSON.stringify({command: 'stop'}));
            } else {
              done();
            }
          });

          server.send(JSON.stringify({command: 'start', port: port, url: '/teams/TDEADBEEF/messages', payload: JSON.stringify({ok: true}), statusCode: 202}));
        });
      });
    });
  });
});
