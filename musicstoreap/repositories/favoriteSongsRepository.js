module.exports = {
    mongoClient: null,
    app: null,
    database: "musicStore",
    collectionName: "favorites_songs",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    getFavorites: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const favorites = await favoritesCollection.find(filter, options).toArray();
            return favorites;
        } catch (error) {
            throw (error);
        }
    },

    findFavorite: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const favorites = await favoritesCollection.findOne(filter, options);
            return favorites;
        } catch (error) {
            throw (error);
        }
    },

    insertFavorite: function (favorite, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const favoritesCollection = database.collection(this.collectionName);
                favoritesCollection.insertOne(favorite)
                    .then(result => callbackFunction({favoriteId: result.insertedId}))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}))
    },

    deleteFavorite: async function (filter) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const result = await favoritesCollection.deleteOne(filter);
            return result;
        } catch (error) {
            throw (error);
        }
    },

    deleteFavorites: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoritesCollection = database.collection(this.collectionName);
            const result = await favoritesCollection.deleteMany(filter, options);
            return result;
        } catch (error) {
            throw (error);
        }
    },


};