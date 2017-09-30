var express = require("express");
var routes = require("./routes.js");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3001;

var app = express();

////////////////////////////////////////////////////////////////////////////////
// SETUP
////////////////////////////////////////////////////////////////////////////////

// STATIC SITE HOSTING

app.use("/", express.static(process.cwd() + "/pages/"));
app.set("view engine", "ejs");
app.set("views", process.cwd() + "/pages/");

// STATIC RESOURCE HOSTING



// INPUT HANDLING

//app.use(bodyParser.urlencoded({extended: true})); // extract json from post request as req.body

// LINK ROUTES

routes(app);

// DATABASE CONNECTION



// SOCKETS

io.on("connection", function(socket){
  console.log("a user connected");
});

////////////////////////////////////////////////////////////////////////////////
// SERVING
////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {console.log("Server launched on port " + port + " at " + (new Date).toUTCString())})
