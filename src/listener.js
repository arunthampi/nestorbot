var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

var TextMessage = require('./message').TextMessage;

// Listeners receive every message from the chat source and decide if they
// want to act on it.
//
// robot    - A Robot instance.
// matcher  - A Function that determines if this listener should trigger the
//            callback.
// options  - An Object of additional parameters keyed on extension name
//            (optional).
// callback - A Function that is triggered if the incoming message matches.
var Listener = function Listener(robot, matcher, options, callback) {
  this.robot = robot;
  this.matcher = matcher;
  this.options = options;
  this.callback = callback;
  if (this.matcher == null) {
    throw new Error("Missing a matcher for Listener");
  }
  if (this.callback == null) {
    this.callback = this.options;
    this.options = {};
  }
  if (this.options.id == null) {
    this.options.id = null;
  }
  if ((this.callback == null) || typeof this.callback !== 'function') {
    throw new Error("Missing a callback for Listener");
  }
};

// TextListeners receive every message from the chat source and decide if they
// want to act on it.
//
// robot    - A Robot instance.
// regex    - A Regex that determines if this listener should trigger the
//            callback.
// options  - An Object of additional parameters keyed on extension name
//            (optional).
// callback - A Function that is triggered if the incoming message matches.
var TextListener = (function(_super) {
  __extends(TextListener, _super);

  function TextListener(robot, regex, options, callback) {
    var _this = this;
    this.robot = robot;
    this.regex = regex;
    this.options = options;
    this.callback = callback;
    this.matcher = function(message) {
      if (message instanceof TextMessage) {
        return message.match(_this.regex);
      }
    };
    TextListener.__super__.constructor.call(this, this.robot, this.matcher, this.options, this.callback);
  }

  return TextListener;

})(Listener);

module.exports = {
  Listener: Listener,
  TextListener: TextListener
};
