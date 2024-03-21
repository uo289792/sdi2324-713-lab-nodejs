const {ObjectId} = require("mongodb");
module.exports = function(app, favoriteSongsRepository, songsRepository) {

    app.get('/songs/favorites', function (req, res) {
        let filter = {};
        let options = {sort: { title: 1}};
        if(req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != "") {
            filter = {"title": {$regex: ".*" + req.query.search + ".*"}};
        }
        favoriteSongsRepository.getFavorites(filter, options).then(favorites => {
            const totalPrices = favorites.reduce((total, song) => total + parseFloat(song.price), 0);
            res.render("songs/favorites.twig", { favorites: favorites, totalPrices: totalPrices });
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones " + error)
        });
    });

    app.post('/songs/favorites/add/:song_id', function (req, res) {
        let filter = {_id:  new ObjectId(req.params.song_id)};
        let favourite = {
            author : req.session.user,
            song_id :  new ObjectId(req.params.song_id),
            date : `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            price: 0,
            title: ''
        }
        songsRepository.findSong( filter, {}).then(song => {
            favourite.price = song.price;
            favourite.title = song.title;
            favoriteSongsRepository.insertFavorite(favourite, function(favouriteId) {
                if (favouriteId == null) {
                    res.send("Error al añadir el elemento");
                } else {
                    res.redirect("/songs/favorites");
                }
            });
        });
    });

    app.get('/songs/favorites/delete/:_id', function (req, res) {
        let filter = {_id: new ObjectId(req.params._id)};
        favoriteSongsRepository.deleteFavorite(filter).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el registro");
            } else {
                res.redirect("/songs/favorites");
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la canción: " + error)
        });
    });

}





