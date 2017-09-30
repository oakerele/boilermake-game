////////////////////////////////////////////////////////////////////////////////
// IMPORTS & EXPORTS
////////////////////////////////////////////////////////////////////////////////

module.exports = {
    "perform": function (msg) {return command(msg)},
    "newPlayer": function (userId, socketId) {return new Player(userId, socketId)},
    "addPlayer": function (player) {playerList.push(player)},
    "removePlayer": function (loc) {playerList.splice(loc)},
    "getPlayers": function () {return playerList},
    "getPlayerNames": function () {return playerNames},
    "addPlayerName": function (name) {console.log(name); playerNames.push(name);},
    "removePlayerName": function (loc) {playerNames.splice(loc)}
}

////////////////////////////////////////////////////////////////////////////////
// DATA STRUCTURE
////////////////////////////////////////////////////////////////////////////////

class Room {
    constructor(roomname, desc, doors, items, players) {
        this.roomname = roomname;
        this.desc = desc;
        this.doors = doors;
        this.items = items;
        this.players = players;
    }
}

class Door {
    constructor(roomname, dir) {
        this.roomname = roomname;
        this.dir = dir;
    }
}

class Item {
    constructor(name) {
        this.name = name;
    }
}

class Player {
    constructor(userId, socketId) {
        this.userId = userId;
        this.socketId = socketId;
    }
}

var playerList = []

////////////////////////////////////////////////////////////////////////////////
// PARSING
////////////////////////////////////////////////////////////////////////////////

// DICTIONARY

var Dets = ["the", "a"]
var Adjs = ["large", "small", "blue", "red", "gold"]
var Ns = ["sword", "axe"] // & any names
var Ps = ["in", "on", "at", "to"]
var Vs = ["say", "yell", "whisper", "go", "take", "give", "pick up"]
var playerNames = []


function lexer(text) {
    return null
}

function parser(tokens) {
    return null
}

////////////////////////////////////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////////////////////////////////////

function invoke(verbPhrase) {
    return verbPhrase.name + ": " + verbPhrase.msg;
}

////////////////////////////////////////////////////////////////////////////////
// CLI
////////////////////////////////////////////////////////////////////////////////

function command(text) {
    var tokens = lexer(text)
    var command = parser(tokens)
    return invoke(text)
}
