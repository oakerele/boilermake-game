////////////////////////////////////////////////////////////////////////////////
// IMPORTS & EXPORTS
////////////////////////////////////////////////////////////////////////////////

module.exports = {
    "perform": function (msg) {return command(msg)},
    "loadWorld": function (json) {return loadWorld(json)}
}

////////////////////////////////////////////////////////////////////////////////
// WORLD
////////////////////////////////////////////////////////////////////////////////

var world = null

////////////////////////////////////////////////////////////////////////////////
// DATA STRUCTURE
////////////////////////////////////////////////////////////////////////////////

class Room {
    constructor(id, name, description, doors, items) {
        this.id = id // unique
        this.name = name
        this.description = description
        this.doors = doors
        this.items = items
    }
    
    addItem(item) {
        this.items.push(item)
    }
    
    getItemById(itemId) {
        return this.items.filter((item) => {return item.id == itemId})[0]
    }
    
    removeItem(itemId) {
        this.items.filter((item) => {return item.id != itemId})
    }
}

class Door {
    constructor(direction, room) {
        this.direction = direction // unique
        this.room = room
    }
    
    traverse(player) {
        player.room = this.room
    }
}

class Item {
    constructor(id, name) {
        this.id = id // unique
        this.name = name
    }
}

class Player {
    constructor(name, socketId, room, inventory) {
        this.name = name // unique
        this.socketId = socketId
        this.room = room
        this.inventory = inventory
    }
    
    move(direction) {
        var doors = world.getRoomById(this.room).doors.filter((door) => {return door.direction == direction})
        if (doors.length == 1) {
            doors[0].traverse(this)
            return true
        } else {
            return false
        }
    }
    
    take(itemName) {
        var room = world.getRoomById(this.room)
        var items = room.items.filter((i) => {return i.name == itemName})
        if (items.length >= 1) {
            room.removeItem(items[0].id)
            this.inventory.push(items[0])
            return true
        } else {
            return false
        }
    }
}

class World {
    constructor(name, startingRooms, rooms, players) {
        this.name = name
        this.startingRooms = startingRooms
        this.rooms = rooms
        this.players = []
    }
    
    addPlayer(name, socketId) {
        var newPlayer = new Player(name, socketId, this.startingRooms[Math.floor(Math.random() * this.startingRooms.length)], [])
        this.players.push(newPlayer)
        return newPlayer
    }
    
    removePlayer(name) {
        this.players = this.players.filter((player) => {return player.name != name})
    }
    
    get playerNames() {
        return this.players.forEach((player) => {return player.name})
    }
    
    getPlayerByName(name) {
        return this.players.filter((player) => {return player.name == name})[0]
    }
    
    getPlayerBySocketId(socketId) {
        return this.players.filter((player) => {return player.socketId == socketId})[0]
    }
    
    getRoomById(id) {
        return this.rooms.filter((room) => {return room.id == id})[0]
    }
}

// WORLD GENERATION

function loadWorld(json) {
    world = new World(json.name, json.startingRooms, json.rooms.map((room) => {
        return new Room(room.id, room.name, room.description, room.doors.map((door) => {
            return new Door(door.direction, door.room)
        }), room.items.map((item) => {
            return new Item(item.id, item.name)
        }))
    }), json.players)
    return world
}

////////////////////////////////////////////////////////////////////////////////
// PARSING
////////////////////////////////////////////////////////////////////////////////

// DICTIONARY

var Ds = [] // ["the", "a"]
var As = [] // ["large", "small", "blue", "red", "gold"]
var Ns = ["north", "east", "south", "west", "gun", "knife", "shovel", "pitchfork"] // ["sword", "axe", "my", "me"] // & any names
var Ps = [] // ["in", "on", "at", "to"]
var Vs = ["go", "move", "walk", "take", "pick up"] // ["say", "yell", "whisper", "go", "take", "give", "pick up", "throw"]
var playerNames = []


function lexer(text) {
    // TODO: invert search direction to search full string to empty string, not empty string to full string
    
    var tokens = []
    
    var substr = ""
    for (var i = 0; i < text.length; i++) {
        substr = substr + text[i]
        
        if (substr.match(/^\s+$/)) { // if substring consists of only whitespace characters (a.k.a. is between a word)
            substr = "" // ignore it
        }
        
        if (Ds.indexOf(substr) >= 0) { // if string is a determiner
            tokens.push({"part": "D", "string": substr})
            substr = ""
        } else if (As.indexOf(substr) >= 0) { // if string is an adjective
            tokens.push({"part": "A", "string": substr})
            substr = ""
        } else if (Ns.indexOf(substr) >= 0 || playerNames.indexOf(substr) >= 0 || substr.match(/^\".*\"$/)) { // if string is a noun
            tokens.push({"part": "N", "string": substr})
            substr = ""
        } else if (Ps.indexOf(substr) >= 0) { // if string is a preposition
            tokens.push({"part": "P", "string": substr})
            substr = ""
        } else if (Vs.indexOf(substr) >= 0) { // if string is a verb
            tokens.push({"part": "V", "string": substr})
            substr = ""
        }
    }
    
    return tokens
}

function parser(tokens) {
    //console.log("tokens: ", tokens)
    
    var lastValidPhrase = null
    var combinedList = [tokens[tokens.length-1]]
    //console.log("combinedList: ", combinedList)
    var i = tokens.length-1
    while (combinedList[0]) {
        //console.log("----------------")
        var VPattempt = parseVerbPhrase(combinedList)
        var NPattempt = parseNounPhrase(combinedList)
        var PPattempt = parsePrepositionalPhrase(combinedList)
        var phraseAttempt = VPattempt || NPattempt || PPattempt
        //console.log("phraseAttempt: ", phraseAttempt)
        
        if (phraseAttempt != null) { // tokens in combinedList are a valid phrase
            //console.log("---- Valid Phrase ----")
            lastValidPhrase = phraseAttempt // save that phrase as the current best
            combinedList.unshift(tokens[i-1]) // add the word before to the beginning of the combinedList
            i-- // update index
        } else if (phraseAttempt == null && lastValidPhrase != null) { // tokens in combinedList are not a valid phrase
            //console.log("---- Invalid Phrase ----")
            combinedList = [combinedList[0], lastValidPhrase] // apply previous valid phrase transformation
        } else { // current phrase is invalid and there is no previously found valid phrase
            //console.log("---- Malformed Phrase ----")
            return null // it's an invalid phrase as a whole
        }
        
        //console.log("combinedList: ", combinedList)
    }
    //console.log("----------------")
    
    //console.log("L: ", combinedList.length)
    if (lastValidPhrase != null && combinedList.length >= 3 && lastValidPhrase.part == "VP") {
        return lastValidPhrase
    } else {
        return null // error
    }
}

// PRIMITIVE PARSERS

function parseVerbPhrase(tokens) {
    var phrase = null
    
    // V
    // V NP
    // V NP PP
    // V PP
    
    switch (tokens.length) {
        case 1:
            if (tokens[0].part == "V") { // V
                phrase = {"part": "VP", "V": tokens[0], "NP": null, "PP": null}
            }
            break
        case 2:
            if (tokens[0].part == "V" && tokens[1].part == "NP") { // V NP
                phrase = {"part": "VP", "V": tokens[0], "NP": tokens[1], "PP": null}
            } else if (tokens[0].part == "V" && tokens[1].part == "PP"){ // V PP
                phrase = {"part": "VP", "V": tokens[0], "NP": null, "PP": tokens[1]}
            }
            break
        case 3:
            if (tokens[0].part == "V" && tokens[1].part == "NP" && tokens[2].part == "PP") { // V NP PP
                phrase = {"part": "VP", "V": tokens[0], "NP": tokens[1], "PP": tokens[2]}
            }
    }
    
    return phrase
}

function parseNounPhrase(tokens) {
    var phrase = null
    
    // N
    // D N
    // A N
    // N PP
    // D A N
    // D N PP
    // A N PP
    // D A N PP
    
    switch (tokens.length) {
        case 1:
            if (tokens[0].part == "N") { // N
                phrase = {"part": "NP", "D": null, "A": null, "N": tokens[0], "PP": null}
            }
            break
        case 2:
            if (tokens[0].part == "D" && tokens[1].part == "N") { // D N
                phrase = {"part": "NP", "D": tokens[0], "A": null, "N": tokens[1], "PP": null}
            } else if (tokens[0].part == "A" && tokens[1].part == "N") { // A N
                phrase = {"part": "NP", "D": null, "A": tokens[0], "N": tokens[1], "PP": null}
            } else if (tokens[0].part == "N" && tokens[1].part == "PP") {
                phrase = {"part": "NP", "D": null, "A": null, "N": tokens[0], "PP": tokens[1]}
            }
            break
        case 3:
            if (tokens[0].part == "D" && tokens[1].part == "A" && tokens[2].part == "N") { // D A N
                phrase = {"part": "NP", "D": tokens[0], "A": tokens[1], "N": tokens[2], "PP": null}
            } else if (tokens[0].part == "D" && tokens[1].part == "N" && tokens[2].part == "PP") { // D N PP
                phrase = {"part": "NP", "D": tokens[0], "A": null, "N": tokens[1], "PP": tokens[2]}
            } else if (tokens[0].part == "A" && tokens[1].part == "N" && tokens[2].part == "PP") { // A N PP
                phrase = {"part": "NP", "D": null, "A": tokens[0], "N": tokens[1], "PP": tokens[2]}
            }
            break
        case 4:
            if (tokens[0].part == "D" && tokens[1].part == "A" && tokens[2].part == "N" && tokens[3].part == "PP") { // D A N PP
                phrase = {"part": "NP", "D": tokens[0], "A": tokens[1], "N": tokens[2], "PP": tokens[3]}
            }
            break
    }
    
    return phrase
}

function parsePrepositionalPhrase(tokens) {
    var phrase = null
    
    // P
    // P PP
    
    switch (tokens.length) {
        case 1:
            if (tokens[0].part == "P") { // P
                phrase = {"part": "PP", "P": tokens[0], "NP": null}
            }
            break
        case 2:
            if (tokens[0].part == "P" && tokens[1].part == "NP") { // P NP
                phrase = {"part": "PP", "P": tokens[0], "NP": tokens[1]}
            }
            break
    }
    
    return phrase
}

////////////////////////////////////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////////////////////////////////////

// CALL ACTIONS

function invoke(command, name) {
    var response = {
        message: "The command could not be understood.",
        scope: "local",
        playersInRoom: [],
        room: ""
    }
    
    if (command != null) {
        switch (command.V.string) {
            case "go":
            case "move":
            case "walk":
                if (command.NP && command.NP.N) {
                    response = move(name, command.NP.N.string)
                    console.log(response)
                }
                break
            case "take":
            case "pick up":
                if (command.NP && command.NP.N) {
                    response.message = take(name, command.NP.N.string)
                }
                break
        }
    }
    
    return response // FIXME: temporary
}

// ACTION LOGIC

function move(name, direction) {
    // form of response
    var response = {
        message: "",
        scope: "local",
        playersInRoom: [],
        room: null
    }
    
    // do movement
    var player = world.getPlayerByName(name)
    if (player) {
        var success = player.move(direction)
    } else {
        success = false
    }
    
    if (success) {
        // tell world about it
        
        response.playersInRoom = world.players.filter((p) => {return p.room == player.room}).map((p) => {return p.name})
        console.log(response.playersInRoom);        
        
        response.message = "went " + direction
    } else {
        response.message = "cannot go " + direction
    }
    
    return response
}

function take(name, item) {
    var player = world.getPlayerByName(name)
    if (player) {
        var success = player.take(item)
    } else {
        success = false
    }
    
    if (success) {
        return "took " + item
    } else {
        return item + " not in room"
    }
    
    // for (var i = 0; i < playerList.length; i++) {
    //     if (playerList[i].id == name) {
    //         var itemList = playerList[i].room.items;
    //         for (var j = 0; j < itemList.length; j++) {
    //             if (item == itemList[j]) {
    //                 var roomnum = playerList[i].room.id;
    //                 roomList[roomnum].items.splice(j);
    //                 playerList[i].items.push(item);
    //                 console.log(playerList[i].items);
    //                 return "took " + item;
    //             } else {
    //                 return item + " not in room";
    //             }
    //         }
    //     }
    // }
    // return item + " not in room";
}

////////////////////////////////////////////////////////////////////////////////
// CLI
////////////////////////////////////////////////////////////////////////////////

function command(msg) {
    var tokens = lexer(msg.msg)
    var command = parser(tokens)
    var response = invoke(command, msg.name)
    return response
}
