var qs = require('qs');
var shell = require('shelljs/shell');

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
}

// Public: Posts a message back to the chat source
//
// strings - One or more strings to be posted. The order of these strings
//           should be kept intact.
//
// Returns boolean flag denoting whether the call was successfully
Response.prototype.send = function(strings, callback) {
  this.__send(strings, false, callback);
};

// Public: Posts a message mentioning the current user.
//
// strings - One or more strings to be posted. The order of these strings
//           should be kept intact.
//
// Returns boolean flag denoting whether the call was successfully
Response.prototype.reply = function(strings, callback) {
  this.__send(strings, true, callback);
};

// Public: Tell the message to stop dispatching to listeners
//
// Returns nothing.
Response.prototype.finish = function() {
  return this.message.finish();
};

Response.prototype.__send = function(strings, reply, callback) {
  if(callback === undefined) {
    callback = function(){};
  }

  stringsPayload = [];

  if(strings instanceof Array) {
    stringsPayload = stringsPayload.concat(strings);
  } else {
    stringsPayload.push(strings);
  }

  // If robot is in debugMode, then don't actually send response back
  // just buffer them and Nestor will deal with it
  if(this.robot.debugMode) {
    this.robot.toSend = this.robot.toSend.concat({strings: stringsPayload, reply: reply });
    callback();
  }

  var authToken = process.env.__NESTOR_AUTH_TOKEN;
  var host = process.env.__NESTOR_API_HOST;
  if (host == null) {
    host = "https://v2.asknestor.me";
  }
  var url = host + "/teams/" + this.robot.teamId + "/messages";

  if(this.message.user == null || this.message.room == null || strings.length == 0) {
    callback();
  }

  params = JSON.stringify({
    message: {
      user_uid: this.message.user.id,
      channel_uid: this.message.room,
      strings: JSON.stringify(strings),
      reply: reply
    }
  });

  this.robot.http(url).
    header('Authorization', authToken).
    header('Content-Type', 'application/json').
    post(params)(function(err, resp, body) {
      callback();
    });
}
module.exports = Response;
