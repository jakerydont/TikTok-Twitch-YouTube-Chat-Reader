const tmi = require('tmi.js');
const constants = require('./constants');

class TwitchIRC {
    constructor(config, authToken, channelName, twitchCom) {
        const that = this;

        this.botName = config.twitch.botName;
        this.channelName = channelName;
        this.authToken = authToken;

        this.twitchCom = twitchCom;

        this.usersInChat = [];

        this.client = new tmi.client({
            connection: {
                reconnect: true
            },
            identity: {
                username: this.channelName,
                password: this.authToken
            },
            channels: [
                this.channelName
            ]
        });

        this.client.on('message', (target, context, msg, self) => {
            if (self) return;
            console.log(msg);
            that.twitchCom.emit('twitchChat', {
                source: 'TWITCH',
                sourceIcon: constants.twitch.sourceIcon,

                authorChannelName: context["display-name"],
                authorChannelId: '',
                message: msg,
                subscriber: context.subscriber,
                profilePictureUrl: ''

            });
        });

        //*
        this.client.on("join", (channel, username, self) => {
            that.twitchCom.apiGetRequest("/helix/users?login=" + username).then((data) => {
                that.twitchCom.emit('twitchUserJoin',{
                    message: "",
                    username: data.data[0].display_name,
                    subscriber: false
                });
            });
        });//*/

        this.client.on('connected', (addr, port) => {
            console.log("Connected to Twitch chat");
            this.twitchCom.emit('twitchChatConnected');
        });

        this.client.on('disconnected', (addr, port) => {
            console.log("Twitch chat disconnected");
            this.twitchCom.emit('twitchChatDisconnected');
        });
    }

    connect() {
        this.client.connect().catch((err) => {
            console.error("Failed to connect to Twitch chat: " + err);
        });
    }
}

module.exports = TwitchIRC;