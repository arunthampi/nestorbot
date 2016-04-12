var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
var Brain = require('../src/brain');
var Robot = require('../src/robot');
var User = require('../src/user');

chai.use(require('sinon-chai'));

describe('Brain', function() {
  beforeEach(function() {
    this.clock = sinon.useFakeTimers();
    this.robot = new Robot('TDEADBEEF', 'UNESTORBOT1', false);
    this.brain = new Brain(this.robot);
    this.user1 = this.brain.userForId('1', {
      name: 'Guy One'
    });
    this.user2 = this.brain.userForId('2', {
      name: 'Guy One Two'
    });
    this.user3 = this.brain.userForId('3', {
      name: 'Girl Three'
    });
  });

  describe('Unit Tests', function() {
    describe('#mergeData', function() {
      it('performs a proper merge with the new data taking precedent', function() {
        this.brain.data._private = {
          1: 'old',
          2: 'old'
        };
        this.brain.mergeData({
          2: 'new'
        });
        expect(this.brain.data._private).to.deep.equal({
          1: 'old',
          2: 'new'
        });
      });
    });

    describe('#get', function() {
      it('returns the saved value', function() {
        this.brain.data._private['test-key'] = 'value';
        expect(this.brain.get('test-key')).to.equal('value');
      });

      it('returns null if object is not found', function() {
        expect(this.brain.get('not a real key')).to.be["null"];
      });
    });

    describe('#set', function() {
      it('saves the value', function() {
        this.brain.set('test-key', 'value');
        expect(this.brain.data._private['test-key']).to.equal('value');
      });

      it('sets multiple keys at once if an object is provided', function() {
        this.brain.data._private = {
          key1: 'val1',
          key2: 'val1'
        };
        this.brain.set({
          key2: 'val2',
          key3: 'val2'
        });
        expect(this.brain.data._private).to.deep.equal({
          key1: 'val1',
          key2: 'val2',
          key3: 'val2'
        });
      });

      it('returns the brain', function() {
        expect(this.brain.set('test-key', 'value')).to.equal(this.brain);
      });
    });

    describe('#remove', function() {
      it('removes the specified key', function() {
        this.brain.data._private['test-key'] = 'value';
        this.brain.remove('test-key');
        expect(this.brain.data._private).to.not.include.keys('test-key');
      });
    });

    describe('#userForId', function() {
      it('returns the user object', function() {
        expect(this.brain.userForId(1)).to.equal(this.user1);
      });

      it('does an exact match', function() {
        var user4 = this.brain.userForId('FOUR');
        expect(this.brain.userForId('four')).to.not.equal(user4);
      });

      it('recreates the user if the room option differs from the user object', function() {
        expect(this.brain.userForId(1).room).to.be.undefined;
        var newUser1 = this.brain.userForId(1, {
          room: 'room1'
        });
        expect(newUser1).to.not.equal(this.user1);
        var newUser2 = this.brain.userForId(1, {
          room: 'room2'
        });
        expect(newUser2).to.not.equal(newUser1);
      });

      describe('when there is no matching user ID', function() {
        it('creates a new User', function() {
          var newUser;
          expect(this.brain.data.users).to.not.include.key('all-new-user');
          newUser = this.brain.userForId('all-new-user');
          expect(newUser).to.be["instanceof"](User);
          expect(newUser.id).to.equal('all-new-user');
          expect(this.brain.data.users).to.include.key('all-new-user');
        });

        it('passes the provided options to the new User', function() {
          var newUser;
          newUser = this.brain.userForId('all-new-user', {
            name: 'All New User',
            prop: 'mine'
          });
          expect(newUser.name).to.equal('All New User');
          expect(newUser.prop).to.equal('mine');
        });
      });
    });

    describe('#userForName', function() {
      it('returns the user with a matching name', function() {
        expect(this.brain.userForName('Guy One')).to.equal(this.user1);
      });
      it('does a case-insensitive match', function() {
        expect(this.brain.userForName('guy one')).to.equal(this.user1);
      });
      it('returns null if no user matches', function() {
        expect(this.brain.userForName('not a real user')).to.be["null"];
      });
    });

    describe('#usersForRawFuzzyName', function() {
      it('does a case-insensitive match', function() {
        expect(this.brain.usersForRawFuzzyName('guy')).to.have.members([this.user1, this.user2]);
      });

      it('returns all matching users (prefix match) when there is not an exact match (case-insensitive)', function() {
        expect(this.brain.usersForRawFuzzyName('Guy')).to.have.members([this.user1, this.user2]);
      });

      it('returns all matching users (prefix match) when there is an exact match (case-insensitive)', function() {
        expect(this.brain.usersForRawFuzzyName('Guy One')).to.deep.equal([this.user1, this.user2]);
        expect(this.brain.usersForRawFuzzyName('guy one')).to.deep.equal([this.user1, this.user2]);
      });

      it('returns an empty array if no users match', function() {
        var result = this.brain.usersForRawFuzzyName('not a real user');
        expect(result).to.be.an('array');
        expect(result).to.be.empty;
      });
    });

    describe('#usersForFuzzyName', function() {
      it('does a case-insensitive match', function() {
        expect(this.brain.usersForFuzzyName('guy')).to.have.members([this.user1, this.user2]);
      });

      it('returns all matching users (prefix match) when there is not an exact match', function() {
        expect(this.brain.usersForFuzzyName('Guy')).to.have.members([this.user1, this.user2]);
      });

      it('returns just the user when there is an exact match (case-insensitive)', function() {
        expect(this.brain.usersForFuzzyName('Guy One')).to.deep.equal([this.user1]);
        expect(this.brain.usersForFuzzyName('guy one')).to.deep.equal([this.user1]);
      });

      it('returns an empty array if no users match', function() {
        var result;
        result = this.brain.usersForFuzzyName('not a real user');
        expect(result).to.be.an('array');
        expect(result).to.be.empty;
      });
    });
  });

  describe('User Searching', function() {
    it('finds users by ID', function() {
      expect(this.brain.userForId('1')).to.equal(this.user1);
    });
    it('finds users by exact name', function() {
      expect(this.brain.userForName('Guy One')).to.equal(this.user1);
    });
    it('finds users by fuzzy name (prefix match)', function() {
      var result = this.brain.usersForFuzzyName('Guy');
      expect(result).to.have.members([this.user1, this.user2]);
      expect(result).to.not.have.members([this.user3]);
    });
  });
});

