const songsRepository = require("../../repositories/songsRepository")
const {ObjectId} = require("mongodb");
exports.songsValidatorUpdate = [
    check("title")
        .if (check("title").exists())
        .trim().isLength({min:5})
        .withMessage("Title must be 5 or more characters"),
    check("kind")
        .if (check("kind").exists())
        .trim().isLength({min:3})
        .withMessage("Title must be 3 or more characters"),
    check("price")
        .if (check("price").exists())
        .trim().isNumeric
        .withMessage("Price must be a number")
        .custom( value => {
            if (value < 0) {
                throw new Error('Price must be > 0')
            }
            return true
        }),
    param("id")
        .if(check("id").exists())
        .custom(async (value, {req}) => {
            let songId = new ObjectId(value)
            const userSession = req.res.user;
            const filtrarSongsAuthor = {$and: [{"_id" : songId}, {"author":userSession}]};
            const songs = await songsRepository.findSongs(filtrarSongsAuthor,{})
            if(song === null) {
                throw new Error("User is not authoriced");
            }
            return true;
        })
]
