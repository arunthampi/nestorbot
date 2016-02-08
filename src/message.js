var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

// Represents an incoming message from the chat.
//
// user - A User instance that sent the message.
var Message = function(user, done) {
  this.user = user;
  this.room = this.user.room;
  this.done = done != null ? done : false;
};

// Indicates that no other Listener should be called on this object
//
// Returns nothing.
Message.prototype.finish = function() {
  this.done = true;
};

// Represents an incoming message from the chat.
//
// user - A User instance that sent the message.
// text - A String message.
// id   - A String of the message ID.
var TextMessage = (function(_super) {
  __extends(TextMessage, _super);

  function TextMessage(user, text, id) {
    this.user = user;
    this.text = text;
    this.id = id;
    TextMessage.__super__.constructor.call(this, this.user);
  }

  // Determines if the message matches the given regex.
  //
  // regex - A Regex to check.
  //
  // Returns a Match object or null.
  TextMessage.prototype.match = function(regex) {
    return this.text.match(regex);
  };

  // String representation of a TextMessage
  //
  // Returns the message text
  TextMessage.prototype.toString = function() {
    return this.text;
  };

  return TextMessage;

})(Message);

module.exports = {
  Message: Message,
  TextMessage: TextMessage,
};


