const {ObjectId} = require("mongodb");
module.exports = function(app, songsRepository)   {


    app.get('/shop', function (req, res) {
        let filter = {};
        let options = {sort: {title: 1}};
        if (req.query.search != null && typeof (req.query.search) != "undefined" &&
            req.query.search != "") {
            filter = {"title": {$regex: ".*" + req.query.search + ".*"}};
        }
        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
            //Puede no venir el param
            page = 1;
        }
        songsRepository.getSongsPg(filter, options, page).then(result => {
            let lastPage = result.total / 4;
            if (result.total % 4 > 0) { // Sobran decimales
                lastPage = lastPage + 1;
            }
            let pages = []; // paginas mostrar
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            let response = {
                songs: result.songs,
                pages: pages,
                currentPage: page
            }
            res.render("shop.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error)
        });
    });

    app.get("/songs", function (req, res) {
        let songs = [{
            "title": "Blank space",
            "price": "1.2"
        }, {
            "title": "See you again",
            "price": "1.3"
        }, {
            "title": "Uptown funk",
            "price": "1.1"
        }];
        let response = {
            seller: "Tienda de canciones",
            songs: songs
        };
        res.render("shop.twig", response);
    });

    app.get('/songs/delete/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        songsRepository.deleteSong(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el registro");
            } else {
                res.redirect("/publications");
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la canción: " + error)
        });
    });

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response))
    });

    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig");
    });



    app.get("/songs/edit/:id", function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        songsRepository.findSong(filter, {}).then(song => {
            res.render("songs/edit.twig", {song:song});
        }).catch(error => {
            res.send("Se ha producido un error al recuperar la canción " + error)
        })
    });

    app.post('/songs/buy/:id', function (req, res) {
        let songId = new ObjectId(req.params.id);
        let shop = {
            user: req.session.user,
            song_id: songId
        }
        userCanBuy(req.session.user, songId).then(canBuy => {
            if (canBuy) {
                songsRepository.buySong(shop).then(result => {
                    if (result.insertedId === null || typeof (result.insertedId) === undefined) {
                        res.send("Se ha producido un error al comprar la canción")
                    } else {
                        res.redirect("/purchases");
                    }
                }).catch(error => {
                    res.send("Se ha producido un error al comprar la canción " + error)
                })
            } else {
                res.send("Se ha producido un error al comprar la canción o ya es tuya");
            }
        });
    });

    async function userCanBuy(user, songId) {
        let filterSongs = { "_id": songId, "author": { $ne: user } }; // Los autores no pueden comprar sus propias canciones
        let filterPurchases = { "song_id": songId, "user": user };
        const songs = await songsRepository.getSongs(filterSongs, {});
        const purchases = await songsRepository.getPurchases(filterPurchases, {});
        return songs.length > 0 && purchases.length === 0;
    }

    app.get('/songs/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)}
        let options = {};
        let user = req.session.user;
        songsRepository.findSong(filter, options).then(song => {
            userCanBuy(user, song._id).then(canBuy => {
                let settings = {
                    url: "https://api.currencyapi.com/v3/latest?apikey=cur_live_OMnjTXLlHpgd3RDjdNdRhEyYtwD8TUG5JEIwO8Hh&base_currency=EUR&currencies=USD",
                    method: "get",
                }
                let rest = app.get("rest");
                rest(settings, function (error, response, body) {
                    console.log("cod: " + response.statusCode + " Cuerpo :" + body);
                    let responseObject = JSON.parse(body);
                    let rateUSD = responseObject.data.USD.value;
                    // nuevo campo "usd" redondeado a dos decimales
                    let songValue = song.price / rateUSD
                    song.usd = Math.round(songValue * 100) / 100
                    res.render("songs/song.twig", {song: song, canBuy: canBuy});
                });
            });
        }).catch(error => {
            res.send("Se ha producido un error al buscar la canción " + error)
        });
    });

    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });

    app.post('/songs/add', function(req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }

        songsRepository.insertSong(song, function (result) {
            if (result.songId !== null && result.songId !== undefined) {
                if (req.files != null) {
                    let image = req.files.cover;
                    image.mv(app.get("uploadPath") + '/public/covers/' + result.songId + '.png')
                        .then(() => {
                            //res.send("Agregada la canción ID: " + result.songId))
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv(app.get("uploadPath") + '/public/audios/' + result.songId + '.mp3')
                                    .then(res.redirect("/publications"))
                                    .catch(error => res.send("Error al subir el audio de la canción"))
                            }else {
                                res.redirect("/publications");
                            }
                        })
                        .catch(error => res.send("Error al subir la portada de la canción"))
                } else {
                    res.redirect("/publications");
                }
            } else {
                res.send("Error al insertar canción " + result.error);
            }
        });
    })

    app.post('/songs/edit/:id', function (req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        let songId = req.params.id;
        let filter = {_id: new ObjectId(songId)};
        //que no se cree un documento nuevo, si no existe
        const options = {upsert: false}
        songsRepository.updateSong(song, filter, options).then(result => {
            //res.send("Se ha modificado "+ result.modifiedCount + " registro");
            step1UpdateCover(req.files, songId, function (result) {
                if (result == null) {
                    res.send("Error al actualizar la portada o el audio de la canción");
                } else {
                    res.redirect("/publications");
                }
            });
        }).catch(error => {
            res.send("Se ha producido un error al modificar la canción " + error)
        });
    })
    function step1UpdateCover(files, songId, callback) {
        if (files && files.cover != null) {
            let image = files.cover;
            image.mv(app.get("uploadPath") + '/public/covers/' + songId + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    step2UpdateAudio(files, songId, callback); // SIGUIENTE
                }
            });
        } else {
            step2UpdateAudio(files, songId, callback); // SIGUIENTE
        }
    };
    function step2UpdateAudio(files, songId, callback) {
        if (files && files.audio != null) {

            let audio = files.audio;
            audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    };

    app.get('/promo*', function (req, res) {

        res.send('Respuesta al patrón promo*');
    });
    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });

    app.get('/publications', function (req, res) {
        let filter = {author : req.session.user};
        let options = {sort: {title: 1}};
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("publications.twig", {songs: songs});
        }).catch(error => {
            res.send("Se ha producido un error al listar las publicaciones del usuario:" + error)
        });
    });

    app.get('/purchases', function (req, res) {
        let filter = {user: req.session.user};
        let options = {projection: {_id: 0, song_id: 1}};
        songsRepository.getPurchases(filter, options).then(purchasedIds => {
            const purchasedSongs = purchasedIds.map(song => song.song_id);
            let filter = {"_id": {$in: purchasedSongs}};
            let options = {sort: {title: 1}};
            songsRepository.getSongs(filter, options).then(songs => {
                res.render("purchases.twig", {songs: songs});
            }).catch(error => {
                res.send("Se ha producido un error al listar las publicaciones del usuario: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error)
        });
    });

};
