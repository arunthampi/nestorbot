var chai = require('chai');
var sinon = require('sinon');
var nock = require('nock');

var User = require('../src/user');
var Robot = require('../src/robot');
var TextMessage = require('../src/message').TextMessage;
var Response = require('../src/response').Response;
var RichResponse = require('../src/response').RichResponse;

chai.use(require('sinon-chai'));
expect = chai.expect;

describe('RichResponse', function() {
  describe('toString', function() {
    it('should return a string representation of RichResponse', function() {
      var r = new RichResponse({title: 'Hello', text: 'Hello for realz', color: 'good'});
      expect(r.toString()).to.eql("Title: Hello, Text: Hello for realz, Color: good");
    });
  });
});

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
    describe('newRichResponse', function() {
      it('should return a RichResponse object', function() {
        var r = this.response.newRichResponse();
        expect(r.constructor).to.eql(RichResponse);
      });
    });

    describe('send', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        context('text payloads', function() {
          it('should buffer responses in robot.toSend', function() {
            this.response.send('hello');
            expect(this.robot.toSend).to.eql([{strings:['hello'], reply: false}]);
          });
        });

        context('rich payloads', function() {
          var r;

          beforeEach(function() {
            r = new RichResponse({text: 'hello 1', image_url: 'https://imgur.com/abc.gif'});
          });

          it('should buffer responses in robot.toSend', function() {
            this.response.send(r);
            expect(this.robot.toSend).to.eql([{strings:[r.toString()], reply: false}]);
          });
        });
      });

      context('when not in debug mode', function() {
        var params, scope;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
        });

        context('with only a single string as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello']),
                reply: false
              }
            }

            scope = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.send('hello', function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with multiple strings as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(["hello 1, hello 2"]),
                reply: false
              }
            }

            scope = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.send(['hello 1', 'hello 2'], function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with rich payload', function() {
          var r1, r2;

          beforeEach(function() {
            r1 = new RichResponse({text: 'hello 1', image_url: 'https://imgur.com/abc.gif'});
            r2 = new RichResponse({text: 'hello 2', image_url: 'https://imgur.com/def.gif'});

            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                rich: JSON.stringify([r1, r2]),
                reply: false
              }
            }

            scope = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.send([r1, r2], function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });
      });
    });

    describe('reply', function() {
      context('when in debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
        });

        context('text payloads', function() {
          it('should buffer responses in robot.toSend', function() {
            this.response.reply('hello');
            expect(this.robot.toSend).to.eql([{strings:['hello'], reply: true}]);
          });
        });

        context('rich payloads', function() {
          var r;

          beforeEach(function() {
            r = new RichResponse({text: 'hello 1', image_url: 'https://imgur.com/abc.gif'});
          });

          it('should buffer responses in robot.toSend', function() {
            this.response.reply(r);
            expect(this.robot.toSend).to.eql([{strings:[r.toString()], reply: true}]);
          });
        });
      });

      context('when not in debug mode', function() {
        var params, scope;

        beforeEach(function() {
          this.robot.debugMode = false;
          process.env.__NESTOR_AUTH_TOKEN = 'authToken';
        });

        context('with only one string as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello']),
                reply: true
              }
            }

            scope = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.reply('hello', function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with multiple strings as the payload', function() {
          beforeEach(function() {
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(["hello 1", "hello 2"]),
                reply: true
              }
            }

            scope = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function() {
            this.response.reply(['hello 1', 'hello 2'], function() {
              expect(scope.isDone()).to.be.true;
            });
          });
        });

        context('with multiple calls to msg.reply (with promises)', function() {
          var scope1, scope2, params1, params2;

          beforeEach(function() {
            params1 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello 1']),
                reply: true
              }
            }

            params2 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello 2']),
                reply: true
              }
            }

            scope1 = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params1)
                .reply(202);

            scope2 = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params2)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function(done) {
            var _this = this;

            _this.response.reply('hello 1').
            then(function() {
              _this.response.reply('hello 2');
            }).
            then(function() {
              expect(scope1.isDone()).to.be.true;
              expect(scope2.isDone()).to.be.true;
              done();
            });
          });
        });

        context('with multiple calls to msg.reply (with callback)', function() {
          var scope1, scope2, params1, params2;

          beforeEach(function() {
            params1 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello 1']),
                reply: true
              }
            }

            params2 = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello 2']),
                reply: true
              }
            }

            scope1 = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params1)
                .reply(202);

            scope2 = nock('https://www.asknestor.me', {
                reqheaders: {
                    'Authorization': 'authToken',
                    'Content-Type': 'application/json'
                  }
                })
                .post('/teams/TDEADBEEF/messages', params2)
                .reply(202);
          });

          it('should make a request to the Nestor API to send a message back to the user', function(done) {
            var _this = this;

            _this.response.reply('hello 1', function() {
              _this.response.reply('hello 2', function() {
                expect(scope1.isDone()).to.be.true;
                expect(scope2.isDone()).to.be.true;
                done();
              });
            });
          });
        });
      });
    });
  });
});
