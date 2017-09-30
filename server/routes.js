module.exports = function(app) {
    
    app.get("/", (req, res, next) => {
        var words = ["This is just a test data", "Lorem Ipsum blac of the blah bla for all routes intended to be directories -> look for keep trying for all routes intended to be directories -> look forfor all routes intended to be directories -> look for one other way is the stuff"];
        // Render page
        res.render("index.ejs", {"cwd": process.cwd(), "gameData": words});
    });
    
    app.get("*.html", (req, res, next) => { // for all pages not already caught
        var path = decodeURIComponent(req.url.substr(1, req.url.length-6) + ".ejs");
        if (fs.existsSync(process.cwd() + "/pages/" + path)) {
            res.render(path, {"cwd": process.cwd()}); // try and render if it exists
        } else {
            next(); // keep trying
        }
    });
    
    app.get("*/", (req, res, next) => { // for all routes intended to be directories -> look for index file
        var path = decodeURIComponent(req.url.substr(1) + "index.ejs");
        if (fs.existsSync(process.cwd() + "/pages/" + path)) {
            res.render(path, {"cwd": process.cwd()}); // remove leading "/" and add "index.ejs"
        } else {
            next(); // keep trying
        }
    });
    
    // // 404 error (the last route)
    // app.use((req, res, next) => {
    //     var err = new Error("Not Found");
    //     err.status = 404;
    //     next(err);
    // });
    // 
    // // 500 error
    // app.use((err, req, res, next) => {
    //     console.error(err);
    //     var status = err.status || 500
    //     res.status(status);
    //     switch (status) {
    //         case 404:
    //             console.log("Could not find resource at: " + req.url);
    //             res.render("404.ejs", {"cwd": process.cwd()});
    //             break;
    //         case 500:
    //             res.render("500.ejs", {"cwd": process.cwd()});
    //             break;
    //         default:
    //             res.render("Error.ejs", {"cwd": process.cwd()});
    //     }
    // });
    
}
