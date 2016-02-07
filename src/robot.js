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

module.exports = Robot;
