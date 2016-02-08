var expect = require('chai').expect;
var User = require('../src/user');

describe('User', function() {
  describe('new', function() {
    it('uses id as the default name', function() {
      var user = new User('nestorbot');
      return expect(user.name).to.equal('nestorbot');
    });

    it('sets attributes passed in', function() {
      var user = new User('hubot', {
        foo: 1,
        bar: 2
      });
      expect(user.foo).to.equal(1);
      expect(user.bar).to.equal(2);
    });

    it('uses name attribute when passed in, not id', function() {
      var user = new User('hubot', {
        name: 'tobuh'
      });
      expect(user.name).to.equal('tobuh');
    });
  });
});
