var qs = require('qs');
var chai = require('chai');
var sinon = require('sinon');
var shell = require('shelljs/shell');

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

      context('when not in debug mode', function() {
        var stub, sandbox;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
          sandbox = sinon.sandbox.create();
          stub = sandbox.stub(shell, 'exec');
          var params = qs.stringify({
            message: {
              user_uid: 'UDEADBEEF1',
              channel_uid: 'CDEADBEEF1',
              strings: '["hello"]',
              reply: false
            }
          })

          cmd = 'curl -sL -w "%{http_code}" -H "Authorization: authToken" https://v2.asknestor.me/teams/TDEADBEEF/messages -d "' + params + '" -o /dev/null'
          stub.withArgs(cmd).returns({stdout: "\n202"});
        });

        afterEach(function() {
          sandbox.restore();
        });

        it('should make a request to the Nestor API to send a message back to the user', function() {
          res = this.response.send('hello');
          expect(res).to.be.true;
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

      context('when not in debug mode', function() {
        var stub, sandbox;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
          sandbox = sinon.sandbox.create();
          stub = sandbox.stub(shell, 'exec');
          var params = qs.stringify({
            message: {
              user_uid: 'UDEADBEEF1',
              channel_uid: 'CDEADBEEF1',
              strings: '["hello"]',
              reply: true
            }
          })

          cmd = 'curl -sL -w "%{http_code}" -H "Authorization: authToken" https://v2.asknestor.me/teams/TDEADBEEF/messages -d "' + params + '" -o /dev/null'
          stub.withArgs(cmd).returns({stdout: "\n202"});
        });

        afterEach(function() {
          sandbox.restore();
        });

        it('should make a request to the Nestor API to send a message back to the user', function() {
          res = this.response.reply('hello');
          expect(res).to.be.true;
        });
      });
    });
  });
});
