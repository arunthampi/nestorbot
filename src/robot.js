var _ref = require('./listener'), Listener = _ref.Listener, TextListener = _ref.TextListener;
var TextMessage = require('./message').TextMessage;
var HttpClient = require('scoped-http-client');
var Response = require('./response').Response;
var Brain = require('./brain');
var Path = require('path');
var Log = require('log');
var Fuse = require('fuse.js');
var XRegExp = require('xregexp');

var __hasProp = {}.hasOwnProperty,
    __slice = [].slice,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
  this.toSend = [];
  this.toSuggest = [];
  this.globalHttpOptions = {};
  this.brain = new Brain(this);

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
Robot.prototype.respondPattern = function(regex, hear) {
  var re = regex.toString().split('/');
  re.shift();

  var modifiers = re.pop();
  var pattern = re.join('/');

  if(hear) {
    newRegex = new XRegExp(pattern, modifiers);
  } else {
    newRegex = new XRegExp("<?@" + this.botId + "\\|*(?:[^>]+)*>?:?\\s*(?:" + pattern + ")", modifiers);
  }

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
  if(!(regex instanceof XRegExp)) { regex = this.respondPattern(regex, true); }
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
  if(!this.debugMode) {
    regex = this.respondPattern(regex, false);
  } else {
    regex = this.respondPattern(regex, true);
  }

  this.hear(regex, options, callback);
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
        console.log("Expected " + full + " to assign a function to module.exports, got " + (typeof script));
      }
    } catch (e) {
      error = e;
      console.log("Unable to load " + full + ": " + error.stack);
      process.exit(1);
    }
  }
};

// Public: Creates a scoped http client with chainable methods for
// modifying the request. This doesn't actually make a request though.
// Once your request is assembled, you can call `get()`/`post()`/etc to
// send the request.
//
// url - String URL to access.
// options - Optional options to pass on to the client
//
// Examples:
//
//     robot.http("http://example.com")
//       # set a single header
//       .header('Authorization', 'bearer abcdef')
//
//       # set multiple headers
//       .headers(Authorization: 'bearer abcdef', Accept: 'application/json')
//
//       # add URI query parameters
//       .query(a: 1, b: 'foo & bar')
//
//       # make the actual request
//       .get() (err, res, body) ->
//         console.log body
//
//       # or, you can POST data
//       .post(data) (err, res, body) ->
//         console.log body
//
//    # Can also set options
//    robot.http("https://example.com", {rejectUnauthorized: false})
//
// Returns a ScopedClient instance.
Robot.prototype.http = function(url, options) {
  return HttpClient.create(url, this.extend({}, this.globalHttpOptions, options)).header('User-Agent', "Nestorbot/" + this.version);
};

// Public: Passes the given message to any interested Listeners
//
// message - A Message instance. Listeners can flag this message as 'done' to
//           prevent further execution.
//
// Returns promise.
Robot.prototype.receive = function(message, done) {
  var _this = this;
  var resp = new Response(_this, message);
  var listener = null;
  var suggestions = [];

  for(var i in this.listeners) {
    l = this.listeners[i];
    if(l.options && l.options.suggestions) {
      suggestions = suggestions.concat(l.options.suggestions.map(function(c) { return { suggestion: c }; }));
    }

    if (match = l.matcher(message)) {
      resp.match = match;
      listener = l;
      break;
    }
  }

  if(listener !== null) {
    var missingEnv = [];
    var requiredEnv = this.requiredEnv || {}

    for(var prop in requiredEnv) {
      var requiredProp = requiredEnv[prop];

      if(requiredProp && requiredProp.required == true && (!(prop in process.env) || process.env[prop] == "")) {
        missingEnv.push({variable: prop, mode: requiredProp.mode});
      }
    }

    if(missingEnv.length > 0) {
      var strings = [];
      var oauthEnv = missingEnv.filter(function(p) { return p.mode == 'oauth'; });
      var userEnv = missingEnv.filter(function(p) { return p.mode == 'user'; });

      if(oauthEnv.length > 0) {
        strings.push("You need to set the following environment variables: " + oauthEnv.map(function(p) { return p.variable; }).join(', '));
        strings.push("You can set " + oauthEnv.map(function(p) { return p.variable; }).join(', ') + " by visiting this URL: https://www.asknestor.me/teams/" + this.teamId + "/powers/" + process.env.__NESTOR_APP_PERMALINK + "/auth");
      } else if(userEnv.length > 0) {
        strings.push("You need to set the following environment variables: " + userEnv.map(function(p) { return p.variable; }).join(', '));
        strings.push("You can set " + userEnv.map(function(p) { return p.variable; }).join(', ') + " by saying `setenv`. For example, `@nestorbot setenv " + userEnv[0].variable + "=example-value`");
      }

      resp.reply(strings, done);
    } else {
      if(listener.callback.length == 1) {
        listener.callback(resp);
        done();
      } else {
        listener.callback(resp, done);
      }
    }
  } else {
    if(suggestions.length > 0) {
      var fuse = new Fuse(suggestions, { keys: ["suggestion"], caseSensitive: false, distance: 10, threshold: 0.4 });
      // Remove the bot ID for better matches
      var message = message.toString().replace(new RegExp("<@" + this.botId + "\\|*(?:[^>]+)*>:?", 'g'), '').trim();

      var results = fuse.search(message);
      this.toSuggest = this.toSuggest.concat(results.map(function(c) { return c.suggestion; }));
      done();
    }
  }
};

// Private: Extend obj with objects passed as additional args.
//
// Returns the original object with updated changes.
Robot.prototype.extend = function() {
  var i, key, len, obj, source, sources, value;
  obj = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (i = 0, len = sources.length; i < len; i++) {
    source = sources[i];
    for (key in source) {
      if (!__hasProp.call(source, key)) continue;
      value = source[key];
      obj[key] = value;
    }
  }
  return obj;
};

module.exports = Robot;
