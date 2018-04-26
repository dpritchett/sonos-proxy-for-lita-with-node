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
    console.log('message', event.data);
  });

  ws.on('close', function(event) {
    console.log('close', event.code, event.reason);
    ws = null;
  });

  ws.on('play_url', function(data) {
    request(
      `http://${discovery.localEndpoint}:${sonosHttpSettings.port}/clipall/${encodeURIComponent(data.url)}/${data.volume}`
    );
  });

  ws.on('play_text', function(data) {
    console.log('Received say: ', data);
    request(
      `http://${discovery.localEndpoint}:${sonosHttpSettings.port}/sayall/${encodeURIComponent(data.text)}/${data.volume}`
    );
  });

  ws.on('close', function() {
    console.log(`Lost contact with server: ${serviceUrl}`);
    console.log("I don't know how to reconnect yet.  Please help!");
    process.exit(1);
  });
};

// start up the http api server
require("sonos-http-api/server");
console.log(`Looking for Sonos speakers`);

connectToCommander();
