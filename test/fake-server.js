'use strict';
var express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// configure log
app.use(morgan('dev'));

var started = false;
exports.isStarted = function() { return started };

var server;

process.on('message', function(configJSON) {
  var config = JSON.parse(configJSON)

  if (config.command === 'start') {
    app.post(config.url, function(req, res){
      res.status(config.statusCode).send(config.payload);
    });

    server = app.listen(config.port, function () {
      started = true;
      return process.send('started');
    });
  }  else {
    server.close(function () {
      return process.send('closed');
    });
  }
});

