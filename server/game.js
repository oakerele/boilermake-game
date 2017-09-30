////////////////////////////////////////////////////////////////////////////////
// IMPORTS & EXPORTS
////////////////////////////////////////////////////////////////////////////////

module.exports = {
    "perform": function (msg) {return command(msg)}
}

////////////////////////////////////////////////////////////////////////////////
// DATA STRUCTURE
////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////
// PARSING
////////////////////////////////////////////////////////////////////////////////

// DICTIONARY

var Ds = ["the", "a"]
var As = ["large", "small", "blue", "red", "gold"]
var Ns = ["sword", "axe", "my", "me"] // & any names
var Ps = ["in", "on", "at", "to"]
var Vs = ["say", "yell", "whisper", "go", "take", "give", "pick up", "throw"]
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
            tokens.push({"part": "N", "string": substr})
            substr = ""
        }
    }
    
    return tokens
}

function parser(tokens) {
    // var phrase = null
    // for (var i = tokens.length; i >= 0; i--) {
    //     console.log(tokens[i])
    // }
    
    return phrase // FIXME: temporary
}

// PRIMITIVE PARSERS

function parseVerbPhrase(tokens) {
    
}

////////////////////////////////////////////////////////////////////////////////
// ACTIONS
////////////////////////////////////////////////////////////////////////////////

function invoke(c) {
    return c // FIXME: temporary
}

////////////////////////////////////////////////////////////////////////////////
// CLI
////////////////////////////////////////////////////////////////////////////////

function command(text) {
    var tokens = lexer(text)
    var command = parser(tokens)
    return invoke(command)
}
