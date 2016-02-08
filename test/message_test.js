var chai = require('chai');
var sinon = require('sinon');
var User = require('../src/user');
var _ref = require('../src/message'), Message = _ref.Message, TextMessage = _ref.TextMessage;

chai.use(require('sinon-chai'));
expect = chai.expect;


describe('Message', function() {
  beforeEach(function() {
    this.user = new User({
      id: 1,
      name: 'nestorbottester',
      room: 'CDEADBEEF1'
    });
  });

  describe('Unit Tests', function() {
    describe('#finish', function() {
      return it('marks the message as done', function() {
        var testMessage = new Message(this.user);
        expect(testMessage.done).to.not.be.ok;
        testMessage.finish();
        expect(testMessage.done).to.be.ok;
      });
    });

    describe('TextMessage', function() {
      describe('#match', function() {
        it('should perform standard regex matching', function() {
          var testMessage = new TextMessage(this.user, 'message123');
          expect(testMessage.match(/^message123$/)).to.be.ok;
          expect(testMessage.match(/^does-not-match$/)).to.not.be.ok;
        });
      });
    });
  });
});
