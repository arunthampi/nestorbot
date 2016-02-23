var Response,
  __slice = [].slice;
var Promise = require('promise');
var URLSafeBase64 = require('urlsafe-base64');

var RichResponse = function RichResponse() {
  this.fallback = null;
  this.color = "good";
  this.pretext = null;
  this.author_name = null;
  this.author_link = null;
  this.author_icon = null;
  this.title = null;
  this.title_link = null;
  this.text = null;
  this.fields = [];
  this.image_url = null;
  this.thumb_url = null;
};

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
};

// Public: Posts a message back to the chat source
//
// strings - One or more strings to be posted. The order of these strings
//           should be kept intact.
//
// Returns boolean flag denoting whether the call was successfully
Response.prototype.send = function(payload, callback) {
  return this.__send(payload, false, callback);
};

// Public: Posts a message mentioning the current user.
//
// strings - One or more strings to be posted. The order of these strings
//           should be kept intact.
//
// Returns boolean flag denoting whether the call was successfully
Response.prototype.reply = function(payload, callback) {
  return this.__send(payload, true, callback);
};

// Public: Tell the message to stop dispatching to listeners
//
// Returns nothing.
Response.prototype.finish = function() {
  return this.message.finish();
};

Response.prototype.__send = function(payload, reply, callback) {
  var textPayloads = [];
  var richPayloads = [];

  if(payload instanceof Array) {
    for(var i in payload) {
      var p = payload[i];
      if (p.constructor == String) {
        textPayloads.push(p);
      } else if (p.constructor == RichResponse) {
        richPayloads.push(p);
      }
    }
  } else if (payload.constructor == String) {
    textPayloads.push(payload);
  } else if (payload.constructor == RichResponse) {
    richPayloads.push(payload);
  }

  var _this = this;
  // If robot is in debugMode, then don't actually send response back
  // just buffer them and Nestor will deal with it
  if(this.robot.debugMode) {
    _this.robot.toSend = _this.robot.toSend.concat({strings: textPayloads, reply: reply });
    if(callback !== undefined) { callback(); }
    return Promise.resolve();
  }

  var authToken = process.env.__NESTOR_AUTH_TOKEN;
  var host = process.env.__NESTOR_API_HOST;
  if (host == null) {
    host = "https://v2.asknestor.me";
  }
  var url = host + "/teams/" + this.robot.teamId + "/messages";

  if(this.message.user == null || this.message.room == null || (textPayloads.length == 0 && richPayloads.length == 0)) {
    if(callback !== undefined) { callback(); }
    return Promise.resolve();
  }

  var params =  JSON.stringify({
    message: {
      user_uid: this.message.user.id,
      channel_uid: this.message.room,
      strings: URLSafeBase64.encode(new Buffer(textPayloads.join("\n"))),
      reply: reply
    }
  });

  return new Promise(function(fulfill, reject) {
    _this.robot.http(url).
      header('Authorization', authToken).
      header('Content-Type', 'application/json').
      post(params)(function(err, resp, body) {
        if(callback !== undefined) { callback(); }
        if (err) { reject(err); } else { fulfill(resp); }
    });
  });
}

module.exports = Response;
