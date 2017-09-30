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

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/pages/index.html');
});
app.use(express.static(__dirname + "/pages"));

////////////////////////////////////////////////////////////////////////////////
// SOCKET CONNECTIONS
////////////////////////////////////////////////////////////////////////////////

game.newWorld();

io.on("connection", function(socket) {

    socket.on("disconnect", function() {
        var list = game.getPlayers();
        var namelist = game.getPlayerNames();
        var name;
        for (var i = 0; i < list.length; i++) {
            if (list[i].socketId == socket.id) {
                name = list[i].id;
                game.removePlayer(i);
            }
        }
        for (var i = 0; i < namelist.length; i++) {
            if (namelist[i] == name) {
                game.removePlayerName(i);
                console.log("Removed Name!");
            }
        }
    });
    
    socket.on("command", function(data) {
        io.emit("response", {"message" : game.perform(data)});
    });

    socket.on("register", function(data) {
        var id = Math.floor(Math.random() * 2);
        var room = game.getRoom(id);
        var newUser = new game.newPlayer(data, socket.id, room);
        game.addPlayer(newUser);
        game.addPlayerName(data);
        socket.emit("playerStatus", {room: room});
    });
})

////////////////////////////////////////////////////////////////////////////////
// RUN SERVER
////////////////////////////////////////////////////////////////////////////////

http.listen(port, () => { console.log("Server running on port " + port + " at "  + (new Date).toUTCString()) })
