const express = require('express');
const { verifyToken } = require('../Middleware/auth.middleware');
const {createRoom, joinRoom} = require('../Controller/room.controller')

const roomRouter = express.Router();

roomRouter
    .post('/create',verifyToken,createRoom)
    .post('/join',verifyToken,joinRoom)

module.exports = roomRouter;