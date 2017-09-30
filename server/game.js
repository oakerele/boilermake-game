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
    "addPlayerName": function (name) {playerNames.push(name);},
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

var Ds = [] // ["the", "a"]
var As = [] // ["large", "small", "blue", "red", "gold"]
var Ns = ["north", "east", "south", "west"] // ["sword", "axe", "my", "me"] // & any names
var Ps = [] // ["in", "on", "at", "to"]
var Vs = ["go"] // ["say", "yell", "whisper", "go", "take", "give", "pick up", "throw"]
var playerNames = []


function lexer(text) {
    
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
            if (tokens[0].part == "D" && tokens[1].part == "A" && tokens[2].part == "N") {
                phrase = {"part": "NP", "D": tokens[0], "A": tokens[1], "N": tokens[2], "PP": null}
            } else if (tokens[0].part == "D" && tokens[1].part == "N" && tokens[2].part == "PP") {
                phrase = {"part": "NP", "D": tokens[0], "A": null, "N": tokens[1], "PP": tokens[2]}
            } else if (tokens[0].part == "A" && tokens[1].part == "N" && tokens[2].part == "PP") {
                phrase = {"part": "NP", "D": null, "A": tokens[0], "N": tokens[1], "PP": tokens[2]}
            }
            break
        case 4:
            if (tokens[0].part == "D" && tokens[1].part == "A" && tokens[2].part == "N" && tokens[3].part == "PP") {
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
            if (tokens[0].part == "P") {
                phrase = {"part": "PP", "P": tokens[0], "NP": null}
            }
            break
        case 2:
            if (tokens[0].part == "P" && tokens[1].part == "NP") {
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
    response = "The command could not be understood."
    
    if (command != null) {
        switch (command.V.string) {
            case "go":
                if (command.NP && command.NP.N) {
                    response = move(name, command.NP.N.string)
                }
                break
            case "n":
                response = move(name, "north")
                break
            case "e":
                response = move(name, "east")
                break
            case "s":
                response = move(name, "south")
                break
            case "w":
                response = move(name, "west")
                break
        }
    }
    
    return response // FIXME: temporary
}

// ACTION LOGIC

function move(name, direction) {
    // TODO: write implementation to actually move player
    return "went " + direction
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
