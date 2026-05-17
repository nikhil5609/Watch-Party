const mongoose = require('mongoose');

const { Schema } = mongoose;

const movieSchema = new Schema({
    movieName: {
        type: String,
        default: "Unknown"
    },
    movieUrl: {
        type: String,
        required: true,
    },
    thumb: {
        type: String,
        default: "images/BigBuckBunny.jpg",
    },
    uploader: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, {
    timestamps: true,
})

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;