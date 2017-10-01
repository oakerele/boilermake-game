var express = require("express")
var app = express()
var http = require("http").Server(app)
var io = require("socket.io")(http)
var game = require("./game.js")

var port = process.env.PORT || 3001

////////////////////////////////////////////////////////////////////////////////
// STATIC HOSTING
////////////////////////////////////////////////////////////////////////////////

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/pages/index.html');
});
app.use(express.static(__dirname + "/pages"));

////////////////////////////////////////////////////////////////////////////////
// GAME WORLD
////////////////////////////////////////////////////////////////////////////////

var testworld = require("./worlds/park.json")
var world = game.loadWorld(testworld)

////////////////////////////////////////////////////////////////////////////////
// SOCKET CONNECTIONS
////////////////////////////////////////////////////////////////////////////////

io.on("connection", function(socket) {

    socket.on("disconnect", function() {
        var player = world.getPlayerBySocketId(socket.id)
        world.removePlayer(player.name)
        console.log("-> player " + player.name + " left the server")
        // TODO: actually delete player object
    });
    
    socket.on("command", function(data) {
        var res = game.perform(data, world);
        if (res.scope == "global")
            io.emit("response", {"res": res});
        else
            socket.emit("response", {"res": res});
        
        res.playersInRoom.forEach((p) => {
            io.emit("enemies", {"enemy": p, "room": res.room});
        })
    });

    socket.on("register", function(name) {
        world.addPlayer(name, socket.id)
        console.log("-> player " + name + " has joined the server")
        socket.emit("playerStatus", {"room": world.getPlayerByName(name).room})
    });
})

////////////////////////////////////////////////////////////////////////////////
// RUN SERVER
////////////////////////////////////////////////////////////////////////////////

http.listen(port, () => { console.log("Server running on port " + port + " at "  + (new Date).toUTCString()) })
