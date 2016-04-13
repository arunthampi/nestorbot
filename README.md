# Nestorbot Programming Manual

Nestor has a large and growing directory of powers that lets you add
superpowers to your Bot.

But there are scenarios where you would want to write your own powers that
power Nestor. For e.g. to access your private stats server, or your own
database to get results or make deploys to your own custom
infrastructure.

Nestor can be programmed using Javascript to create a powerful bot for
your team that can automate away the mundane.

Nestor's API is based on [Hubot's API](https://hubot.github.com/docs/scripting/) and it tries to be as compatible as
possible with Hubot's API -- The Nestor Programming Manual has also been adapted from the Hubot documentation.

Nestor is powered by "powers" that are analogous to Hubot scripts.

[![Build
Status](https://travis-ci.org/zerobotlabs/nestorbot.svg?branch=master)](https://travis-ci.org/zerobotlabs/nestorbot)

## Structure of a Power

A Nestor power is at its most fundamental an NPM package with a couple of
caveats:

* It must have [nestorbot](https://www.npmjs.com/package/nestorbot) as a dependency
* It must contain a JSON file called `nestor.json` with details about
  the power. More on that later.
* It must export a function that accepts an instance of
  `[Robot](https://github.com/zerobotlabs/nestorbot/blob/master/src/robot.js)`

Something like this:

```javascript
module.exports = function(robot) {
  // Your code goes here...
};
```

## Hearing and Responding

Nestor can `hear` messages said in a Slack channel or `respond` to
messages directly addressed at it.

A `hear` method is invoked for every message that is received in a channel whereas `respond` is invoked when a message is addressed to nestorbot itself (for e.g. "@nestorbot what's the weather now?")

Both methods take a regular expression and a callback function as
parameters.

For example:

```javascript
module.exports = function(robot) {
  robot.hear(/gif( me)? (.*?)$/i, function(msg, done) {
    // your code here
  });

  robot.respond(/hello/i, function(msg, done) {
    // your code here
  });
};
```

The `robot.hear(/gif( me)? (.*?)$/i` callback is called anytime a message's text matches. For example:

* gif me honey badger
* gif fail whale
* give me a gif star wars


The `robot.respond /hello/i` callback is only called for messages that are immediately preceded by nestorbot's nickname.

* @nestorbot: hello
* hello @nestorbot

It wouldn't be called for:

* nestorbot hello
  * because it doesn't contain the Slack User ID for nestorbot
* hello
  * because it is not addressed to nestorbot

## Send and Reply

The `msg` parameter is an instance of `Response`. With it, you can `send` a message back to the channel the `msg` came from, or `reply` to the person that sent the message. For example:

```javascript
module.exports = function(robot) {
  robot.hear(/gif me honeybadger/i, function(msg, done) {
    msg.send("https://media.giphy.com/media/aui0RuYoqtRa8/giphy-facebook_s.jpg", done)
  });

  robot.respond(/weather in san francisco/i, function(msg, done) {
    msg.reply("sunny and awesome", done);
  });
};
```
The `robot.hear /gif me honeybadgers/` callback sends a message exactly as specified regardless of who said it, "https://media.giphy.com/media/aui0RuYoqtRa8/giphy-facebook_s.jpg"

If a user Bob says "@nestorbot: weather in san francisco", `robot.respond /weather in san francisco/i` callback sends a message "@bob: sunny and awesome"

### Sending and Replying Sequentially

For users familiar with the existing Hubot API, you might have been
curious about the presence of a "done" argument in `robot.hear` and
`robot.respond`. This is because Nestor powers are invoked in
container-ized sandboxes that exit once the power has been completed.
Since node.js methods are asynchronous, we need to let the Nestor Power
Execution Engine that the power has completed -- and that's where the
`done` argument comes in. When `done` is passed as an argument to either
`send` or `reply` the Execution Engine will then "return" from the
function and the power will no longer be executed.

If you need to send data more than once, not to worry -- `msg.reply` and
`msg.send` return promises that can be used to order messages in a given
sequence. As an example:

```javascript
module.exports = function(robot) {
  robot.respond(/weather in san francisco/i, function(msg, done) {
    msg.reply("sunny and awesome").then(function() {
      msg.send("the best weather", done);
    });
  });
};
```

will first send "sunny and awesome", followed by "the best weather".

## Capturing data

So far, our powers have had static responses, which while amusing, are boring functionality-wise. `msg.match` has the result of `match`ing the incoming message against the regular expression. This is just a [JavaScript thing](http://www.w3schools.com/jsref/jsref_match.asp), which ends up being an array with index 0 being the full text matching the expression. If you include capture groups, those will be populated `res.match`. For example, if we update an power like:

```javascript
module.exports = function(robot) {
  robot.respond(/weather in (.*)/i, function(msg, done) {
    // your code here
  });
};
```

If Bob says "@nestorbot: weather in san francisco", then `res.match[0]` is "weather in san francisco", and `res.match[1]` is just "san francisco". Now we can start doing more dynamic things:

```javascript
module.exports = function(robot) {
  robot.respond(/weather in (.*)/i, function(msg, done) {
    location = msg.match[1];

    if(location == "san francisco") {
      msg.reply("sunny and awesome", done);
    } else {
      msg.reply("i don't know", done);
    }
  });
};
```

## Making HTTP Calls

Nestorbot can make HTTP calls on your behalf to integrate & consume third party APIs. This can be through an instance of [node-scoped-http-client](https://github.com/technoweenie/node-scoped-http-client) available at `robot.http`. The simplest case looks like:


```javascript
module.exports = function(robot) {
  robot.http("https://my-favorite-website").get()(function(err, res, body) {
    // Your code here
  });
};
```

A post looks like:

```javascript
module.exports = function(robot) {
  var data = JSON.stringify({
    foo: 'bar'
  });

  robot.http("https://my-favorite-website").
        header('Content-Type', 'application/json').
        post(data)(function(err, res, body) {
          // Your Code Here
        });
};
```


`err` is an error encountered on the way, if one was encountered. You'll generally want to check for this and handle accordingly:

```javascript
module.exports = function(robot) {
  robot.http("https://my-favorite-website").get()(function(err, res, body) {
    if (err) {
      msg.send("Encountered an error :( " + err);
    }

    // Your code here -- knowing the HTTP call was successful
  });
};
```

`res` is an instance of node's [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse). Most of the methods don't matter as much when using `HttpClient`, but of interest are `statusCode` and `getHeader`. Use `statusCode` to check for the HTTP status code, where usually non-200 means something bad happened. Use `getHeader` for peeking at the header, for example to check for rate limiting:

```javascript
module.exports = function(robot) {
  robot.http("https://my-favorite-website").get()(function(err, res, body) {
    var rateLimitRemaining;
    if (res.statusCode !== 200) {
      msg.send("Request didn't come back HTTP 200 :(", done);
    }
    if (res.getHeader('X-RateLimit-Limit')) {
      rateLimitRemaining = parseInt(res.getHeader('X-RateLimit-Limit'));
    }
    if (rateLimitRemaining && rateLimitRemaining < 1) {
      msg.send("Rate Limit hit, stop believing for awhile", done);
    }

    // Rest of your code
  });
};
```

`body` is the response's body as a string, the thing you probably care about the most:

```javascript
module.exports = function(robot) {
  robot.http("https://my-favorite-website").get()(function(err, res, body) {
    msg.send("Got back " + body);
  });
};
```

### JSON

If you are talking to APIs, the easiest way is going to be JSON because it doesn't require any extra dependencies. When making the `robot.http` call, you should usually set the  `Accept` header to give the API a clue that's what you are expecting back. Once you get the `body` back, you can parse it with `JSON.parse`:

```javascript
module.exports = function(robot) {
  robot.http("https://my-favorite-api").
        header('Accept', 'application/json').
        get()(function(err, res, body) {
    var data = JSON.parse(body);
    msg.send(data.key + " value is " + data.value);
  });
};
```

It's possible to get non-JSON back, like if the API hit an error and it tries to render a normal HTML error instead of JSON. To be on the safe side, you should check the         `Content-Type`, and catch any errors while parsing.

```javascript
module.exports = function(robot) {
  robot.http("https://my-favorite-api").
        header('Accept', 'application/json').
        get()(function(err, res, body) {
    var data, error;
    if (response.getHeader('Content-Type') !== 'application/json') {
      msg.send("Didn't get back JSON :(");
      return;
    }

    data = null;
    try {
      return data = JSON.parse(body);
    } catch (_error) {
      error = _error;
      msg.send("Ran into an error parsing JSON :(");
    }
  });
};
```

### XML

XML APIs are harder because there's not a bundled XML parsing library. It's beyond the scope of this documentation to go into detail, but here are a few libraries to check out:

* [xml2json](https://github.com/buglabs/node-xml2json) (simplest to use, but has some limitations)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)

### Screen scraping

For those times that there isn't an API, there's always the possibility of screen-scraping. It's beyond the scope of this documentation to go into detail, but here's a few libraries to check out:

* [cheerio](https://github.com/MatthewMueller/cheerio) (familiar syntax and API to jQuery)
* [jsdom](https://github.com/tmpvar/jsdom) (JavaScript implementation of the W3C DOM)


### Advanced HTTP and HTTPS settings

As mentioned, nestorbot uses [node-scoped-http-client](https://github.com/technoweenie/node-scoped-http-client) to provide a simple interface for making HTTP and HTTP requests. Under its hood, it's using node's builtin [http](http://nodejs.org/api/http.html) and [https](http://nodejs.org/api/https.html) libraries, but providing an easy DSL for the most common kinds of interaction.

In addition, if node-scoped-http-client doesn't suit you, you can can use [http](http://nodejs.org/api/http.html) and [https](http://nodejs.org/api/https.html) yourself directly, or any other node library like [request](https://github.com/request/request).

## Environment Variables

If you use API keys and other secrets in your power, it's not a good idea to hard code them in your code. Nestorbot allows you to have environment variables in your power so that code & data can be kept separate. You can set environment variables in the power by going to the section titled "Environment" for each power.

```javascript
module.exports = function(robot) {
  robot.respond(/what is the answer to the ultimate question of life/, function(msg, done) {
    answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING;
    msg.send(answer + ", but what is the question?", done);
  });
};
```
We can also check if the environment variable is set and respond accordingly.

```javascript
module.exports = function(robot) {
  robot.respond(/what is the answer to the ultimate question of life/, function(msg, done) {
    answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING;
    if (answer == null) {
      msg.send("Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again", done);
    }

    msg.send(answer + ", but what is the question?", done);
  });
};
```

### Persistence

Nestorbot has a persistent key-value store exposed as `robot.brain` that can be
used to store and retrieve data by powers.

```javascript
robot.respond(/have a soda/i, function(res, done) {
  // Get number of sodas had (coerced to a number).
  var sodasHad = robot.brain.get('totalSodas') * 1 || 0;

  if(sodasHad > 4) {
    res.reply("I'm too fizzy..", done);
  } else {
    res.reply('Sure!', done);
  }

  robot.brain.set('totalSodas', sodasHad+1);
}

robot.respond(/sleep it off/i, function(res, done) {
  robot.brain.set('totalSodas', 0);
  msg.reply('zzzzz', done);
}
```

If the power needs to lookup user data, there are methods on `robot.brain` for looking up one or many users by id, name, or 'fuzzy' matching of name: `userForName`, `userForId`, and `usersForFuzzyName`.

```javascript
module.exports = function(robot) {
  robot.respond(/who is @?([\w .\-]+)\?*$/i, function(res, done) {
    name = res.match[1].trim();
    users = robot.brain.usersForFuzzyName(name);

    if(users.length >= 1) {
      var user = users[0]
      // Do something interesting here..
      res.send(name + " is user " user, done);
    }
  };
};
```

## Things to Note

* The filesystem available to Nestor powers is not persistent. Any files
  that you write will not be available on the next run of the power.
* You have a maximum of 60 seconds to complete a request made to Nestorbot. If there are use cases for which you'd want longer execution time, please get in touch at [concierge@asknestor.me](mailto:concierge@asknestor.me).


## Feature Requests / Bug Reports / Corrections

If you have feature requests, bug reports in both the power as well as the manual, please [raise an issue](https://github.com/zerobotlabs/nestorbot/issues).
