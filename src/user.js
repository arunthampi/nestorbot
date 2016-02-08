// Represents a participating user in the chat.
//
// id      - A unique ID for the user.
// options - An optional Hash of key, value pairs for this user.
var User = function User(id, options) {
  var k;
  this.id = id;
  if (options == null) {
    options = {};
  }
  for (k in options || {}) {
    this[k] = options[k];
  }
  this['name'] || (this['name'] = this.id.toString());
}

module.exports = User;

