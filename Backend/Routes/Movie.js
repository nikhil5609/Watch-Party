const express = require('express');
const { verifyToken } = require('../Middleware/auth.middleware');
const { addMovie, getMovies, deleteMovie } = require('../Controller/movie.controller');
const multer = require('multer');

const movieRouter = express.Router();

// multer config
const upload = multer({ dest: "uploads/" });

movieRouter
    .post('/add',verifyToken,upload.single("video"),addMovie)
    .get('/get-movies',verifyToken,getMovies)
    .delete('/delete/:movieId',verifyToken,deleteMovie)

module.exports = movieRouter;