var _ref = require('./listener'), Listener = _ref.Listener, TextListener = _ref.TextListener;
var TextMessage = require('./message').TextMessage;

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


module.exports = Robot;
