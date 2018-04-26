"use strict";
const singlePlayerAnnouncement = require("sonos-http-api/lib/helpers/single-player-announcement");
const tryDownloadTTS = require("sonos-http-api/lib/helpers/try-download-tts");
const settings = require("./settings");
const sonosHttpSettings = require("sonos-http-api/settings");
const SonosSystem = require("sonos-discovery");
const discovery = new SonosSystem(sonosHttpSettings);
var request = require("request");

// connect to socket for bot commands
// the basic idea is that we just proxy commands to the referenced HTTP API

var connectToCommander = function () {
  var serviceUrl = settings.clearbotUrl;
  var WebSocket = require('faye-websocket'),
    ws        = new WebSocket.Client(serviceUrl);

  ws.on('open', function(event) {
    console.log('open');
    ws.send('Hello, world!');
  });

  ws.on('message', function(event) {
    var payload = JSON.parse(event.data);

    console.log(payload);

    var command = payload.command;
    var data = payload.data;

    if(!command) {
      return console.log("No command detected.");
    } else {
      switch(command) {
        case 'play_text':
          console.log('Received say text request: ', data);
          request(
            `http://${discovery.localEndpoint}:${sonosHttpSettings.port}/sayall/${encodeURIComponent(data.text)}/${data.volume}`
          );
          break;
        case 'play_url':
          console.log('Received Play Url request: ', data);
          request(
            `http://${discovery.localEndpoint}:${sonosHttpSettings.port}/clipall/${encodeURIComponent(data.url)}/${data.volume}`
          );
          break;
        default:
          console.log('Unhandled command received! ' + command);
      }
    }
  });

  ws.on('close', function() {
    console.log('close', event.code, event.reason);
    ws = null;

    console.log(`Lost contact with server: ${serviceUrl}`);
    console.log("I don't know how to reconnect yet.  Please help!");
    process.exit(1);
  });
};

// start up the http api server
require("sonos-http-api/server");
console.log(`Looking for Sonos speakers`);

connectToCommander();
