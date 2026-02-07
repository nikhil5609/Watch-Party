const express = require('express');
const { verifyToken } = require('../Middleware/auth.middleware');
const {createRoom, joinRoom, setVideo, verifyVideo, playVideo} = require('../Controller/room.controller')

const roomRouter = express.Router();

roomRouter
    .post('/create',verifyToken,createRoom)
    .post('/join',verifyToken,joinRoom)
    .post('/set-video',verifyToken,setVideo)
    .post('/verify-video',verifyToken,verifyVideo)
    .post('/play',verifyToken,playVideo)

module.exports = roomRouter;