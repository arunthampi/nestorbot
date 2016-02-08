var chai = require('chai');
var sinon = require('sinon');
var Robot = require('../src/robot');

chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('Robot', function() {
  beforeEach(function() {
    this.robot = new Robot('TDEADBEEF', 'UNESTORBOT1', false);
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
  });
});

