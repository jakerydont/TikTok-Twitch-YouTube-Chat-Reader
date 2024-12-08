const { BaseConnectionWrapper, getGlobalConnectionCount } = require('./BaseConnectionWrapper');
const YoutubeLiveChatReader = require('./YouTubeLiveChatReader');

class YouTubeConnectionWrapper extends BaseConnectionWrapper {
    constructor(youTubeLiveVideoId, options, enableLog) {
        super(youTubeLiveVideoId, options, enableLog);

        this.connection = new YoutubeLiveChatReader(youTubeLiveVideoId, options);

        this.connection.on('streamEnd', () => {
            this.log(`streamEnd event received, giving up connection`);
            this.reconnectEnabled = false;
        });

        this.connection.on('disconnected', () => {
            globalConnectionCount -= 1;
            this.log(`YouTube connection disconnected`);
            this.scheduleReconnect();
        });

        this.connection.on('error', (err) => {
            this.log(`Error event triggered: ${err.info}, ${err.exception}`);
            console.error(err);
        });
    }

    connect(isReconnect) {
        this.connection.connect().then((state) => {
            this.log(`${isReconnect ? 'Reconnected' : 'Connected'} to roomId ${state.roomId}, websocket: ${state.upgradedToWebsocket}`);

            globalConnectionCount += 1;

            // Reset reconnect vars
            this.reconnectCount = 0;
            this.reconnectWaitMs = 1000;

            // Client disconnected while establishing connection => drop connection
            if (this.clientDisconnected) {
                this.connection.disconnect();
                return;
            }

            // Notify client
            if (!isReconnect) {
                this.emit('connected', state);
            }

        }).catch((err) => {
            this.log(`${isReconnect ? 'Reconnect' : 'Connection'} failed, ${err}`);

            if (isReconnect) {
                // Schedule the next reconnect attempt
                this.scheduleReconnect(err);
            } else {
                // Notify client
                this.emit('disconnected', err.toString());
            }
        });
    }
}

module.exports = {
    YouTubeConnectionWrapper,
    getGlobalConnectionCount
};