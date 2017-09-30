var express = require("express")
var app = express()
var http = require("http").Server(app)
var io = require("socket.io")(http)
var game = require("./game.js")
var mongodb = require("mongodb")

var port = process.env.PORT || 3001

////////////////////////////////////////////////////////////////////////////////
// STATIC HOSTING
////////////////////////////////////////////////////////////////////////////////

app.use(express.static(__dirname + "/pages"))

////////////////////////////////////////////////////////////////////////////////
// SOCKET CONNECTIONS
////////////////////////////////////////////////////////////////////////////////

io.on("connection", function(socket) {
    console.log("user connected.")
    socket.on("disconnect", function() {
        console.log("user disconnected.")
    })
    
    socket.on("command", function(msg) {
        io.emit("response", {"message" : game.perform(msg)})
    })
})

////////////////////////////////////////////////////////////////////////////////
// RUN SERVER
////////////////////////////////////////////////////////////////////////////////

http.listen(port, () => { console.log("Server running on port " + port + " at "  + (new Date).toUTCString()) })
