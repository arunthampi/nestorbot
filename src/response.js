var qs = require('qs');
var rp = require('request-promise');

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
// Returns nothing.
Response.prototype.send = function() {
  var strings;
  strings = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return this.__send(strings, false);
};

// Public: Posts a message mentioning the current user.
//
// strings - One or more strings to be posted. The order of these strings
//           should be kept intact.
//
// Returns nothing.
Response.prototype.reply = function() {
  var strings;
  strings = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return this.__send(strings, true);
};

// Public: Tell the message to stop dispatching to listeners
//
// Returns nothing.
Response.prototype.finish = function() {
  return this.message.finish();
};

Response.prototype.__send = function(strings, reply) {
  // If robot is in debugMode, then don't actually send response back
  // just buffer them and Nestor will deal with it
  if(this.robot.debugMode) {
    if(this.message.done) {
      return;
    }

    if(reply) {
      this.robot.toReply = this.robot.toReply.concat(strings);
    } else {
      this.robot.toSend = this.robot.toSend.concat(strings);
    }

    this.finish();
  } else {
    if(this.message.done) {
      return;
    }

    var _this = this;
    var authToken = process.env.__NESTOR_AUTH_TOKEN;
    var host = process.env.__NESTOR_API_HOST;
    if(host == null) {
      host = "https://v2.asknestor.me";
    }
    var url = host + "/teams/" + this.robot.teamId + "/messages";

    if(this.message.user == null || this.message.room == null || strings.length == 0) {
      return;
    }

    params = {
      message: {
        user_uid: this.message.user.id,
        channel_uid: this.message.room,
        strings: JSON.stringify(strings),
        reply: reply
      }
    }

    return rp({
      uri: url,
      headers: {
        'Authorization': authToken
      },
      method: 'POST',
      body: qs.stringify(params)
    }).then(function(res) {
      _this.message.finish();
    });
  }
}
module.exports = Response;
