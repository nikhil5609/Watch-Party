const express = require('express');
const { verifyToken } = require('../Middleware/auth.middleware');
const {createRoom, joinRoom, setVideo, verifyVideo, playVideo} = require('../Controller/room.controller')

const roomRouter = express.Router();

roomRouter
    .post('/create',createRoom)
    .post('/join',joinRoom)
    .post('/set-video',setVideo)
    .post('/verify-video',verifyVideo)
    .post('/play',playVideo)

module.exports = roomRouter;
