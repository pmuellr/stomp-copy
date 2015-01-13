var fs = require("fs")

var NANO    = require("nano")
var cfenv   = require("cfenv")
var stomp   = require("stomp-client")
var express = require("express")

//------------------------------------------------------------------------------
var RecordsRead    = 0
var RecordsWritten = 0
var IndexHtml      = fs.readFileSync("index.html", "utf8")
var LastTen        = []
var StompServer
var StompQueue

var DB

//------------------------------------------------------------------------------
var appEnv = cfenv.getAppEnv()

startWebServer(appEnv)
startStompReader(appEnv)

//------------------------------------------------------------------------------
function startWebServer(appEnv) {
  var app = express()

  app.get('/', handleHomePage)

  app.listen(appEnv.port, appEnv.bind, serverStarted)
}

//------------------------------------------------------------------------------
function serverStarted() {
  console.log("server starting on " + appEnv.url)
}

//------------------------------------------------------------------------------
function handleHomePage(request, response) {
  var html = IndexHtml

  var lastTen = getLastTen()

  html = html.replace("%%server%%",           StompServer)
  html = html.replace("%%queue%%",            StompQueue)
  html = html.replace("%%messagesRead%%",     RecordsRead)
  html = html.replace("%%messagesWritten%%",  RecordsWritten)
  html = html.replace("%%last10messages%%",   getLastTen())

  response.send(html)
}

//------------------------------------------------------------------------------
function getLastTen() {
  var result = []

  result.push("<table border=1 cellpadding=5 cellspacing=0>")
  LastTen.forEach(function(record) {
    result.push("<tr><td><pre>" + JSON.stringify(record, null, 2)) + "</pre>"
  })
  result.push("</table>")

  return result.join("\n")
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

  var dbCreds = appEnv.getServiceCreds("stomp-db") || {}

  var host   = stompCreds.host
  var queue  = stompCreds.queue
  var dbName = getDBName(queue)

  StompServer = host
  StompQueue  = queue

  var client = new stomp(host)

  if (!dbCreds.url) {
    console.log("service credential stomp-db.url not found; using http://localhost:5984")
    dbCreds.url = "http://localhost:5984"
  }

  createDB(dbCreds.url, dbName)

  client.connect(function(sessionId) {
      client.subscribe(queue, function(body, headers) {
        RecordsRead++
        if (0 == RecordsRead % 100) {
          console.log("records read:    " + RecordsRead)
        }

        var record
        try {
          record = JSON.parse(body)
        }
        catch (e) {
          record = {data: body}
        }

        writeRecord(record)

        while (LastTen.length >= 10) {
          LastTen.shift()
        }

        LastTen.push(record)
      })
  })
}

//------------------------------------------------------------------------------
function writeRecord(record) {
  if (!DB) return

  DB.insert(record, onInserted)

  //-----------------------------------
  function onInserted(err) {
    if (err) {
      return console.log("error inserting record: ", err)
    }

    RecordsWritten++

    if (0 == RecordsWritten % 100) {
      console.log("records written: " + RecordsWritten)
    }
  }
}

//------------------------------------------------------------------------------
function createDB(url, dbName) {
  var nano = NANO(url)

  console.log("destroying database " + dbName)
  nano.db.destroy(dbName, onDestroyed)

  //-----------------------------------
  function onDestroyed(err) {
    if (err && err.statusCode != 404) {
      return console.log("error destroying database: ", err)
    }

    console.log("creating database " + dbName)
    nano.db.create(dbName, onCreated)
  }

  //-----------------------------------
  function onCreated(err) {
    if (err) {
      console.log("error creating database: ", err)
    }

    DB = nano.use(dbName)
  }
}

//------------------------------------------------------------------------------
function getDBName(queueName) {
  var chars = queueName.split("")
  chars = chars.map(function(c) {
    if (c.match(/[0-9]/)) return c
    if (c.match(/[a-z]/)) return c
    if (c.match(/[A-Z]/)) return c.toLowerCase()
    return "-"
  })

  return "q-" + chars.join("")
}
