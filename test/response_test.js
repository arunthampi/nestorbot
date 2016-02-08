var qs = require('qs');
var chai = require('chai');
var sinon = require('sinon');
var nock = require('nock');

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
    nock.disableNetConnect();
  });

  describe('Public API', function() {
    describe('send', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        it('should buffer responses in robot.toSend', function() {
          this.response.send('hello');
          expect(this.robot.toSend).to.eql(['hello']);
        });
      });

      context('when not in debug mode', function() {
        var scope;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';

          params = {
            message: {
              user_uid: this.message.user.id,
              channel_uid: this.message.room,
              strings: JSON.stringify(['hello']),
              reply: false
            }
          }

          scope = nock('https://v2.asknestor.me', {
                        reqheaders: {
                          'Authorization': 'authToken'
                        }
                      }).
                      post('/teams/TDEADBEEF/messages', qs.stringify({
                          message: {
                            user_uid: 'UDEADBEEF1',
                            channel_uid: 'CDEADBEEF1',
                            strings: '["hello"]',
                            reply: false
                          }
                      })).
                      reply(202);
        });

        it('should make a request to the Nestor API to send a message back to the user', function(done) {
          this.response.send('hello').then(function(data) {
            expect(scope.isDone()).to.be.true;
            done();
          })
        });
      });
    });

    describe('reply', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        it('should buffer responses in robot.toSend', function() {
          this.response.reply('hello');
          expect(this.robot.toReply).to.eql(['hello']);
        });
      });

      context('when not in debug mode', function() {
        var scope;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';

          params = {
            message: {
              user_uid: this.message.user.id,
              channel_uid: this.message.room,
              strings: JSON.stringify(['hello']),
              reply: false
            }
          }

          scope = nock('https://v2.asknestor.me', {
                        reqheaders: {
                          'Authorization': 'authToken'
                        }
                      }).
                      post('/teams/TDEADBEEF/messages', qs.stringify({
                          message: {
                            user_uid: 'UDEADBEEF1',
                            channel_uid: 'CDEADBEEF1',
                            strings: '["hello"]',
                            reply: true
                          }
                      })).
                      reply(202);
        });

        it('should make a request to the Nestor API to send a message back to the user', function(done) {
          this.response.reply('hello').then(function(data) {
            expect(scope.isDone()).to.be.true;
            done();
          })
        });
      });
    });
  });
});
