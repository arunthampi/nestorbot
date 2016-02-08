var _ref = require('./listener'), Listener = _ref.Listener, TextListener = _ref.TextListener;
var TextMessage = require('./message').TextMessage;
var Response = require('./response');
var Path = require('path');
var Log = require('log');
var Promise = require('bluebird');

// Robots receive messages from Nestor and dispatch them to matching listeners.
//
// teamId      - A String of the ID of the team that Hubot is serving
// botId       - A String of the Bot ID
// debugMode   - Boolean flag to denote if robot is in debug mode
//
// Returns nothing.
//
var Robot = function(teamId, botId, debugMode) {
  this.teamId = teamId;
  this.botId = botId;
  this.debugMode = debugMode;
  this.listeners = [];
  if(this.debugMode == true) {
    process.env.NESTOR_LOG_LEVEL = 'debug';
  }
  this.logger = new Log(process.env.NESTOR_LOG_LEVEL || 'info');
};

// Public: Build a regular expression that matches messages addressed
// directly to the robot
//
// regex - A RegExp for the message part that follows the robot's name
//
// Returns RegExp.
Robot.prototype.respondPattern = function(regex) {
  var re = regex.toString().split('/');
  re.shift();

  var modifiers = re.pop();
  if (re[0] && re[0][0] === '^') {
    this.logger.warning("Anchors don't work well with respond, perhaps you want to use 'hear'");
    this.logger.warning("The regex in question was " + (regex.toString()));
  }

  var pattern = re.join('/');

  newRegex = new RegExp("[<]?[@]?" + this.botId + "(?:[^>]+>:)?\\s*(?:" + pattern + ")", modifiers);
  return newRegex;
};

// Public: Adds a Listener that attempts to match incoming messages based on
// a Regex.
//
// regex    - A Regex that determines if the callback should be called.
// options  - An Object of additional parameters keyed on extension name
//            (optional).
// callback - A Function that is called with a Response object.
//
// Returns nothing.
Robot.prototype.hear = function(regex, options, callback) {
  this.listeners.push(new TextListener(this, regex, options, callback));
};

// Public: Adds a Listener that attempts to match incoming messages directed
// at the robot based on a Regex. All regexes treat patterns like they begin
// with a '^'
//
// regex    - A Regex that determines if the callback should be called.
// options  - An Object of additional parameters keyed on extension name
//            (optional).
// callback - A Function that is called with a Response object.
//
// Returns nothing.
Robot.prototype.respond = function(regex, options, callback) {
  this.hear(this.respondPattern(regex), options, callback);
};

// Public: Loads a file in path.
//
// path - A String path on the filesystem.
// file - A String filename in path on the filesystem.
//
// Returns nothing.
Robot.prototype.loadFile = function(path, file) {
  var error, e, script;
  var ext = Path.extname(file);
  var full = Path.join(path, Path.basename(file, ext));

  if (require.extensions[ext]) {
    try {
      script = require(full);
      if (typeof script === 'function') {
        script(this);
      } else {
        return this.logger.warning("Expected " + full + " to assign a function to module.exports, got " + (typeof script));
      }
    } catch (e) {
      error = e;
      this.logger.error("Unable to load " + full + ": " + error.stack);
      return process.exit(1);
    }
  }
};

// Public: Passes the given message to any interested Listeners
//
// message - A Message instance. Listeners can flag this message as 'done' to
//           prevent further execution.
//
// Returns promise.
Robot.prototype.receive = function(message, cb) {
  var promises = [];

  for(var i in this.listeners) {
    var listener = this.listeners[i];

    var resp = new Response(this, message);
    reply = listener.callback(resp);

    if(reply instanceof Promise) {
    } else {
      reply = new Promise(function(resp) {})
    }

    promises.push(reply);
  };

  Promise.join(promises, cb);
};

module.exports = Robot;
