var chai = require('chai');
var sinon = require('sinon');
var nock = require('nock');

var Robot = require('../src/robot');
var TextMessage = require('../src/message').TextMessage;
var User = require('../src/user');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Robot', function() {
  beforeEach(function() {
    this.robot = new Robot('TDEADBEEF', 'UNESTORBOT1', false);
    this.user = new User('UDEADBEEF1', {
      name: 'nestorbottester',
      room: 'CDEADBEEF1'
    });
  })

  describe('Unit Tests', function() {
    describe('#http', function() {
      beforeEach(function() {
        var url;
        url = 'http://localhost';
        this.httpClient = this.robot.http(url);
      });

      it('creates a new ScopedHttpClient', function() {
        expect(this.httpClient).to.have.property('get');
        expect(this.httpClient).to.have.property('post');
      });

      it('passes options through to the ScopedHttpClient', function() {
        var agent, httpClient;
        agent = {};
        httpClient = this.robot.http('http://localhost', {
          agent: agent
        });
        expect(httpClient.options.agent).to.equal(agent);
      });

      it('sets a sane user agent', function() {
        expect(this.httpClient.options.headers['User-Agent']).to.contain('Nestorbot');
      });

      it('merges in any global http options', function() {
        var agent, httpClient;
        agent = {};
        this.robot.globalHttpOptions = {
          agent: agent
        };
        httpClient = this.robot.http('http://localhost');
        expect(httpClient.options.agent).to.equal(agent);
      });

      it('local options override global http options', function() {
        var agentA, agentB, httpClient;
        agentA = {};
        agentB = {};
        this.robot.globalHttpOptions = {
          agent: agentA
        };
        httpClient = this.robot.http('http://localhost', {
          agent: agentB
        });
        expect(httpClient.options.agent).to.equal(agentB);
      });
    });

    describe('#hear', function() {
      it('registers a new listener directly', function() {
        expect(this.robot.listeners).to.have.length(0);
        this.robot.hear(/.*/, function() {});
        expect(this.robot.listeners).to.have.length(1);
      });
    });

    describe('#respond', function() {
      it('registers a new listener directly', function() {
        expect(this.robot.listeners).to.have.length(0);
        this.robot.respond(/.*/, function() {});
        expect(this.robot.listeners).to.have.length(1);
      });
    });

    describe('#respondPattern', function() {
      it('matches messages starting with robot\'s name', function() {
        var testMessage = "<@" + this.robot.botId + '>: message123';
        var testRegex = /(.*)/;
        var pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);

        var match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });

      it('matches messages starting with robot\'s name (in Slack style)', function() {
        var testMessage = "<@" + this.robot.botId + "|nestorbot>: " + 'message123';
        var testRegex = /(.*)/;
        var pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.match(pattern);

        var match = testMessage.match(pattern)[1];
        expect(match).to.equal('message123');
      });

      it('does not match unaddressed messages', function() {
        var pattern, testMessage, testRegex;
        testMessage = 'message123';
        testRegex = /(.*)/;
        pattern = this.robot.respondPattern(testRegex);
        expect(testMessage).to.not.match(pattern);
      });
    });

    describe('#loadFile', function() {
      beforeEach(function() {
        this.sandbox = sinon.sandbox.create();
      });

      afterEach(function() {
        this.sandbox.restore();
      });

      it('should require the specified file', function() {
        var module = require('module');
        var script = sinon.spy(function(robot) {});
        this.sandbox.stub(module, '_load').returns(script);
        this.robot.loadFile('./scripts', 'test-script.js');
        expect(module._load).to.have.been.calledWith('scripts/test-script');
      });

      describe('proper script', function() {
        beforeEach(function() {
          var module = require('module');
          this.script = sinon.spy(function(robot) {});
          this.sandbox.stub(module, '_load').returns(this.script);
        });

        it('should call the script with the Robot', function() {
          this.robot.loadFile('./scripts', 'test-script.js');
          expect(this.script).to.have.been.calledWith(this.robot);
        });
      });

      describe('non-Function script', function() {
        beforeEach(function() {
          var module = require('module');
          this.script = {};
          this.sandbox.stub(module, '_load').returns(this.script);
        });

        it('logs a warning', function() {
          sinon.stub(console, 'log');
          this.robot.loadFile('./scripts', 'test-script.js');
          expect(console.log).to.have.been.called;
        });
      });
    });

    describe('#receive', function() {
      var testMessage, callback1, callback2;

      beforeEach(function() {
        testMessage = new TextMessage(this.user, 'message123');
      });

      context('debug mode', function() {
        beforeEach(function() {
          this.robot.debugMode = true;
          this.robot.listeners = [];
        });

        context('two handlers with the same callback', function(done) {
          beforeEach(function() {
            callback1 = function(response) { response.send('hello 1'); };
            callback2 = function(response) { response.send('hello 2'); };

            this.robot.hear(/message123/, callback1);
            this.robot.hear(/message123/, callback2);
          });

          it('should call callback1 and not callback2', function(done) {
            var _this = this;
            this.robot.receive(testMessage, function() {
              expect(_this.robot.toSend).to.eql([{strings: ['hello 1'], reply: false}]);
              done();
            });
          });
        });

        context('with suggestions', function(done) {
          context('with respond', function() {
            beforeEach(function() {
              this.robot.debugMode = false;
              callback1 = function(response) { response.send('hello 1'); };
              this.robot.respond(/heroku list apps (.*)?/, {suggestions: ["heroku list apps"]}, callback1);
              testMessage = new TextMessage(this.user, '<@UNESTORBOT1>: hreoku lis app');
            });

            it('should populate toSuggest with heroku list apps', function(done) {
              var _this = this;
              this.robot.receive(testMessage, function() {
                expect(_this.robot.toSuggest).to.eql(["heroku list apps"]);
                done();
              });
            });
          });

          context('with only one listener', function() {
            beforeEach(function() {
              this.robot.debugMode = false;
              callback1 = function(response) { response.send('hello 1'); };
              this.robot.hear(/heroku list apps (.*)?/, {suggestions: ["heroku list apps"]}, callback1);
              testMessage = new TextMessage(this.user, 'hreoku lis app');
            });

            it('should populate toSuggest with heroku list apps', function(done) {
              var _this = this;
              this.robot.receive(testMessage, function() {
                expect(_this.robot.toSuggest).to.eql(["heroku list apps"]);
                done();
              });
            });
          });

          context('with multiple listeners', function() {
            beforeEach(function() {
              this.robot.debugMode = false;
              callback1 = function(response) { response.send('list apps'); };
              callback2 = function(response) { response.send('migrate apps'); };
              this.robot.hear(/heroku list apps (.*)?/, {suggestions: ["heroku list apps <app-filter>"]}, callback1);
              this.robot.hear(/heroku migrate app (.*)?/, {suggestions: ["heroku migrate app <app>"]}, callback2);
              testMessage = new TextMessage(this.user, 'hreoku lis app');
            });

            it('should populate toSuggest with heroku list apps', function(done) {
              var _this = this;
              this.robot.receive(testMessage, function() {
                expect(_this.robot.toSuggest).to.eql(["heroku list apps <app-filter>"]);
                expect(_this.robot.toSend).to.eql([]);
                done();
              });
            });
          });
        });

        context('only one of the handlers match', function(done) {
          beforeEach(function() {
            callback1 = function(response) { response.send('hello 1'); };
            callback2 = function(response) { response.send('hello 2'); };

            this.robot.respond(/message456/, callback1);
            this.robot.hear(/message123/, callback2);
          });


          it('should call callback1 and not callback2', function(done) {
            var _this = this;
            this.robot.receive(testMessage, function() {
              expect(_this.robot.toSend).to.eql([{strings: ['hello 2'], reply: false}]);
              done();
            });
          });
        });

        context('with unicode characters & regex', function() {
          beforeEach(function() {
            testMessage = new TextMessage(this.user, "Senõr");
            callback1 = function(response) { response.send('hello 1'); };
            this.robot.respond(/\pL+$/, callback1);
          });

          it('should call the callback', function(done) {
            var _this = this;
            this.robot.receive(testMessage, function() {
              expect(_this.robot.toSend).to.eql([{strings: ['hello 1'], reply: false}]);
              done();
            });
          });
        });

        context('with the message containing the bot id without <> characters (debugMode is false)', function() {
          var params;
          var scope;

          beforeEach(function() {
            this.robot.debugMode = false;
            process.env.__NESTOR_AUTH_TOKEN = 'authToken';
            params = {
              message: {
                user_uid: 'UDEADBEEF1',
                channel_uid: 'CDEADBEEF1',
                text: JSON.stringify(['hello 1']),
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

            testMessage = new TextMessage(this.user, "@UNESTORBOT1 hello");
            callback1 = function(response) { response.send('hello 1'); };
            this.robot.respond(/hello/, callback1);
          });

          it('should call the callback', function(done) {
            this.robot.receive(testMessage, function() {
              expect(scope.isDone()).to.be.true;
              done();
            });
          });
        });

        context('there are required env variables', function() {
          context('when required env variables need to be set by OAuth', function() {
            beforeEach(function() {
              callback1 = function(response) { response.send('hello 1'); };
              callback2 = function(response) { response.send('hello 2'); };

              this.robot.respond(/message456/, callback1);
              this.robot.hear(/message123/, callback2);
              process.env.__NESTOR_APP_PERMALINK = 'hello';
              delete(process.env.ENV1);
              delete(process.env.ENV2);

              this.robot.requiredEnv = {
                'ENV1': {
                  required: true,
                  mode: 'oauth'
                },
                'ENV2': {
                  required: true,
                  mode: 'oauth'
                },
                'ENV3': {
                  required: false,
                  mode: 'user'
                }
              }
            });

            context('ENV1 and ENV2 are not set', function() {
              it('should send a warning message that you need to set the required env vars', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ["You need to set the following environment variables: ENV1, ENV2",
                                                                "You can set ENV1, ENV2 by visiting this URL: https://www.asknestor.me/teams/TDEADBEEF/powers/hello/auth"], reply: true}]);
                  done();
                });
              });
            });

            context('ENV1 is set and ENV2 is not set', function() {
              beforeEach(function() {
                process.env.ENV1 = 'env1';
              });

              it('should send a warning message that you need to set the required env vars', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ["You need to set the following environment variables: ENV2",
                                                                "You can set ENV2 by visiting this URL: https://www.asknestor.me/teams/TDEADBEEF/powers/hello/auth"], reply: true}]);
                  done();
                });
              });
            });

            context('ENV1 and ENV2 are set but ENV3 is not set', function() {
              beforeEach(function() {
                process.env.ENV1 = 'env1';
                process.env.ENV2 = 'env2';
              });

              it('should callback2', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ['hello 2'], reply: false}]);
                  done();
                });
              });
            });
          });

          context('when required env variables need to be set by OAuth and by the user', function() {
            beforeEach(function() {
              callback1 = function(response) { response.send('hello 1'); };
              callback2 = function(response) { response.send('hello 2'); };

              this.robot.respond(/message456/, callback1);
              this.robot.hear(/message123/, callback2);
              process.env.__NESTOR_APP_PERMALINK = 'hello';
              delete(process.env.ENV1);
              delete(process.env.ENV2);

              this.robot.requiredEnv = {
                'ENV1': {
                  required: true,
                  mode: 'oauth'
                },
                'ENV2': {
                  required: true,
                  mode: 'user'
                },
                'ENV3': {
                  required: false,
                  mode: 'user'
                }
              }
            });

            context('ENV1 and ENV2 are not set', function() {
              it('should send a warning message that you need to set the required env vars', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ["You need to set the following environment variables: ENV1",
                                                                "You can set ENV1 by visiting this URL: https://www.asknestor.me/teams/TDEADBEEF/powers/hello/auth"], reply: true}]);
                  done();
                });
              });
            });

            context('ENV1 is set and ENV2 is not set', function() {
              beforeEach(function() {
                process.env.ENV1 = 'env1';
              });

              it('should send a warning message that you need to set the required env vars', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ["You need to set the following environment variables: ENV2",
                                                                "You can set ENV2 by saying `setenv`. For example, `@nestorbot setenv ENV2=example-value`"], reply: true}]);
                  done();
                });
              });
            });

            context('ENV1 and ENV2 are set but ENV3 is not set', function() {
              beforeEach(function() {
                process.env.ENV1 = 'env1';
                process.env.ENV2 = 'env2';
              });

              it('should callback2', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ['hello 2'], reply: false}]);
                  done();
                });
              });
            });
          });

          context('when required env variables need to be set by the user', function() {
            beforeEach(function() {
              callback1 = function(response) { response.send('hello 1'); };
              callback2 = function(response) { response.send('hello 2'); };
              delete(process.env.ENV1);
              delete(process.env.ENV2);

              this.robot.respond(/message456/, callback1);
              this.robot.hear(/message123/, callback2);
              this.robot.requiredEnv = {
                'ENV1': {
                  required: true,
                  mode: 'user'
                },
                'ENV2': {
                  required: true,
                  mode: 'user'
                },
                'ENV3': {
                  required: false,
                  mode: 'user'
                }
              }
            });

            context('ENV1 and ENV2 are not set', function() {
              it('should send a warning message that you need to set the required env vars', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ["You need to set the following environment variables: ENV1, ENV2",
                                                                "You can set ENV1, ENV2 by saying `setenv`. For example, `@nestorbot setenv ENV1=example-value`"], reply: true}]);
                  done();
                });
              });
            });

            context('ENV1 is set and ENV2 is not set', function() {
              beforeEach(function() {
                process.env.ENV1 = 'env1';
              });

              it('should send a warning message that you need to set the required env vars', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ["You need to set the following environment variables: ENV2",
                                                                "You can set ENV2 by saying `setenv`. For example, `@nestorbot setenv ENV2=example-value`"], reply: true}]);
                  done();
                });
              });
            });

            context('ENV1 and ENV2 are set but ENV3 is not set', function() {
              beforeEach(function() {
                process.env.ENV1 = 'env1';
                process.env.ENV2 = 'env2';
              });

              it('should callback2', function(done) {
                var _this = this;
                this.robot.receive(testMessage, function() {
                  expect(_this.robot.toSend).to.eql([{strings: ['hello 2'], reply: false}]);
                  done();
                });
              });
            });
          });
        });

        context('handler has an asynchronous function', function(done) {
          beforeEach(function() {
            nock.disableNetConnect();
            nock('https://api.github.com', {
                    reqheaders: {
                      'accept': 'application/json'
                    }
                  }).
                  get('/user/show/technoweenie').
                  reply(200, JSON.stringify({user: 'technoweenie'}));

            callback1 = function(response, complete) {
              response.robot.http('https://api.github.com').
                             header('accept', 'application/json').
                             path('user/show/technoweenie')
                             .get()(function(err, resp, body) {
                               r = JSON.parse(body);
                               response.send(r['user']);
                               complete();
                             });
            };

            this.robot.hear(/message123/, callback1);
          });

          it('should call callback1 and wait for the http request to complete', function(done) {
            var _this = this;
            this.robot.receive(testMessage, function() {
              expect(_this.robot.toSend).to.eql([{strings: ['technoweenie'], reply: false}]);
              done();
            });
          });
        });
      });
    });
  });
});

