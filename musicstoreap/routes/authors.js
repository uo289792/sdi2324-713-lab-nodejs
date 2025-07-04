module.exports = function(app) {

    let authors = [{
        "name": "Alex Turner",
        "group": "Arctic Monkeys",
        "role": "cantante"
    }, {
        "name": "Angus Young",
        "group": "AC/DC",
        "role": "guitarrista"
    }, {
        "name": "Adam Levine",
        "group": "Maroon 5",
        "role": "cantante"
    }];

    app.get("/authors", function(req, res) {

        let response = {
            seller: "Autores",
            authors: authors
        };
        res.render("authors/authors.twig", response);
    });

    app.get('/authors/add', function (req, res) {
        let roles = [{
            "name": "Cantante",
            "value": "cantante"
        },{
            "name": "Batería",
            "value": "batería"
        },{
            "name": "Guitarrista",
            "value": "guitarrista"
        },{
            "name": "Bajista",
            "value": "bajista"
        },{
            "name": "Pianista",
            "value": "pianista"
        }];

        let response = {
            roles: roles
        };

        res.render("authors/add.twig", response);
    });

    app.post('/authors/add', function (req, res) {
        let response = "";
        if (req.body.name !== null && typeof(req.body.name) != "undefined" && req.body.name.trim() !== "") {
            response = "Nombre: " + req.body.name + "<br>";
        } else {
            response += "Nombre no enviado en la petición" + "<br>";
        }
        if (req.body.group !== null && typeof(req.body.group) != "undefined" && req.body.group.trim() !== "") {
            response += "Grupo: " + req.body.group + "<br>";
        } else {
            response += "Grupo no enviado en la petición" + "<br>";
        }
        if (req.body.role !== null && typeof(req.body.role) != "undefined" && req.body.role.trim() !== "") {
            response += "Rol: " + req.body.role + "<br>";
        } else {
            response += "Role no enviado en la petición" + "<br>";
        }
        res.send(response);
    });

    app.get("/authors/filter/:role", function (req, res) {

        let filteredList = authors.filter(author => author.role.toLowerCase().trim() === req.params.role.toLowerCase().trim());

        let response = {
            seller: "Autores",
            authors: filteredList
        };
        res.render("authors/authors.twig", response);
    });

    app.get("/authors*", function(req, res) {
        res.redirect("/authors");
    });

};