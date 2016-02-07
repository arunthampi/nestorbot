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

module.exports = Robot;
