require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./TiktokConnectionWrapper');
const { YouTubeConnectionWrapper, getYouTubeGlobalConnectionCount } = require('./YouTubeConnectionWrapper');
const { clientBlocked } = require('./limiter');
const TwitchCom = require('./TwitchCom');
const Constants = require('./constants');

const app = express();
const httpServer = createServer(app);

// Enable cross origin resource sharing
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

this.twitchCom = new TwitchCom('./config.json', this, app, httpServer);


io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    console.info('New browser-to-server connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    socket.on(Constants.tiktok.events.setUniqueId, (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
        } else {
            options = {};
        }

        // Session ID in .env file is optional
        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        // Check if rate limit exceeded
        if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
            socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
            return;
        }

        // Connect to the given username (uniqueId)
        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('tiktokDisconnected', err.toString());
            return;
        }

        // Redirect wrapper control events once
        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

        // Notify client when stream ends
        tiktokConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

        // Redirect message events
        tiktokConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        tiktokConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        tiktokConnectionWrapper.connection.on('chat', msg => socket.emit('chat', msg));
        tiktokConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
        tiktokConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        tiktokConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
        tiktokConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        tiktokConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        tiktokConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        tiktokConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        tiktokConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        tiktokConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        tiktokConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });

    
    socket.on(Constants.youtube.events.setUniqueId, (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
        } else {
            options = {};
        }

        // Session ID in .env file is optional
        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        // Check if rate limit exceeded
        if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
            socket.emit('youTubeDisconnected', 'YOUTUBE: You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
            return;
        }

        // Connect to the given username (uniqueId)
        try {
            youTubeConnectionWrapper = new YouTubeConnectionWrapper(uniqueId, options, true);
            youTubeConnectionWrapper.connect();
        } catch (err) {
            socket.emit('youTubeDisconnected', err.toString());
            if (youTubeConnectionWrapper) {
                youTubeConnectionWrapper.disconnect();
            }
            return;
        }

        // Redirect wrapper control events once
        youTubeConnectionWrapper.once('connected', state => socket.emit('youTubeConnected', state));
        youTubeConnectionWrapper.once('disconnected', reason => socket.emit('youTubeDisconnected', reason));

        // Notify client when stream ends
        youTubeConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

        // Redirect message events
        youTubeConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        youTubeConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        youTubeConnectionWrapper.connection.on('chat', msg => {
            socket.emit('chat', msg)
        });
        youTubeConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
        youTubeConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        youTubeConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
        youTubeConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        youTubeConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        youTubeConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        youTubeConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        youTubeConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        youTubeConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        youTubeConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
    });

    socket.on('setTwitchId', () => {




        // // Check if rate limit exceeded
        // if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
        //     socket.emit('youTubeDisconnected', 'YOUTUBE: You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
        //     return;
        // }

        this.twitchCom.connect();

        // // Connect to the given username (uniqueId)
        // try {
        //     youTubeConnectionWrapper = new YouTubeConnectionWrapper(uniqueId, options, true);
        //     youTubeConnectionWrapper.connect();
        // } catch (err) {
        //     socket.emit('youTubeDisconnected', err.toString());
        //     return;
        // }

        // // Redirect wrapper control events once
        // youTubeConnectionWrapper.once('connected', state => socket.emit('youTubeConnected', state));
        // youTubeConnectionWrapper.once('disconnected', reason => socket.emit('youTubeDisconnected', reason));

        // // Notify client when stream ends
        // youTubeConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));
        this.twitchCom.on('twitchChat', msg => {5
            socket.emit('chat', msg)
        });

        
        // // Redirect message events
        // youTubeConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        // youTubeConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        // youTubeConnectionWrapper.connection.on('chat', msg => {
        //     socket.emit('chat', msg)
        // });
        // youTubeConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
        // youTubeConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        // youTubeConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
        // youTubeConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        // youTubeConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        // youTubeConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        // youTubeConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        // youTubeConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        // youTubeConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        // youTubeConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
    })
});

// Emit global connection statistics
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
    io.emit('statistic', { youTubeGlobalConnectionCount: getYouTubeGlobalConnectionCount() });
}, 5000)

// Serve frontend files
app.use(express.static('public'));

// Start http listener
const port = process.env.PORT || 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);