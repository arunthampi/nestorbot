var Response,
  __slice = [].slice;

// Public: Responses are sent to matching listeners. Messages know about the
// content and user that made the original message, and how to reply back to
// them.
//
// robot   - A Robot instance.
// message - A Message instance.
// match   - A Match object from the successful Regex match.
var Response = function Response(robot, message, match) {
  this.robot = robot;
  this.message = message;
  this.match = match;
  this.envelope = {
    room: this.message.room,
    user: this.message.user,
    message: this.message
  };
}

module.exports = Response;
