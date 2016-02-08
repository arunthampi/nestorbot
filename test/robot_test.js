var chai = require('chai');
var sinon = require('sinon');
var Promise = require('bluebird');

var Robot = require('../src/robot');
var TextMessage = require('../src/message').TextMessage;
var User = require('../src/user');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Robot', function() {
  beforeEach(function() {
    this.robot = new Robot('TDEADBEEF', 'UNESTORBOT1', false);
    this.user = new User('1', {
      name: 'nestorbottester',
      room: 'CDEADBEEF1'
    });
  })

  describe('Unit Tests', function() {
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
        var testMessage = this.robot.botId + ' message123';
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
          sinon.stub(this.robot.logger, 'warning');
          this.robot.loadFile('./scripts', 'test-script.js');
          expect(this.robot.logger.warning).to.have.been.called;
        });
      });
    });

    describe('#receive', function() {
      var testMessage;

      beforeEach(function() {
        testMessage = new TextMessage(this.user, 'message123');
      });

      context("callback don't return Promises", function() {
        it('calls all registered listeners', function(done) {
          var listener = {
            callback: function(response) {}
          };
          sinon.spy(listener, 'callback');
          this.robot.listeners = [listener, listener, listener, listener];

          this.robot.receive(testMessage, function() {
            expect(listener.callback).to.have.callCount(4);
            done();
          });
        });
      });

      context("some of the callbacks return Promises", function() {
        it('calls all registered listeners', function(done) {
          var listener1 = {
            callback: function(response) {}
          };

          var listener2 = {
            callback: function(response) {
              new Promise(function(resolve) {});
            }
          };
          sinon.spy(listener1, 'callback');
          sinon.spy(listener2, 'callback');
          this.robot.listeners = [listener1, listener2, listener1, listener2];

          this.robot.receive(testMessage, function() {
            expect(listener1.callback).to.have.callCount(2);
            expect(listener2.callback).to.have.callCount(2);
            done();
          });
        });
      });
    });
  });
});

