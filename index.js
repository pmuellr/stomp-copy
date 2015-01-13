var cfenv   = require("cfenv")
var stomp   = require("stomp-client")
var express = require("express")

//------------------------------------------------------------------------------
var RecordsRead = 0

//------------------------------------------------------------------------------
var appEnv = cfenv.getAppEnv()

startWebServer(appEnv)
startStompReader(appEnv)

//------------------------------------------------------------------------------
function startWebServer(appEnv) {
  var app = express()

  app.get('/', function (req, res) {
    res.send("records read: " + RecordsRead)
  })

  app.listen(appEnv.port, appEnv.bind, function() {
    console.log("server starting on " + appEnv.url)
  })
}

//------------------------------------------------------------------------------
function startStompReader(appEnv) {
  var stompCreds = appEnv.getServiceCreds("stomp")

  if (!stompCreds) {
    console.log("service 'stomp' not found")
    if (process.argv[2] && process.argv[3]) {
      console.log("using command-line values for host and queue")
      stompCreds = {
        host:  process.argv[2],
        queue: process.argv[3]
      }
    }
    if (!stompCreds) return
  }

  var host  = stompCreds.host
  var queue = stompCreds.queue

  var client = new stomp(host)

  client.connect(function(sessionId) {
      client.subscribe(queue, function(body, headers) {
        RecordsRead++
        console.log("This is the body of a message on the subscribed queue:", body)
      })
  })
}
