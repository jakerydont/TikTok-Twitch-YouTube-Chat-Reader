const { BaseConnectionWrapper, getGlobalConnectionCount } = require('./BaseConnectionWrapper');
const { WebcastPushConnection } = require('tiktok-live-connector');
const Constants = require('./constants').tiktok;

class TikTokConnectionWrapper extends BaseConnectionWrapper {
    constructor(uniqueId, options, enableLog) {
        super(uniqueId, options, enableLog);

        this.connection = new WebcastPushConnection(uniqueId, options);

        this.connection.on(Constants.events.streamEnd, () => {
            this.log(`${Constants.logPrefix}streamEnd event received, giving up connection`);
            this.reconnectEnabled = false;
        });

        this.connection.on(Constants.events.disconnected, () => {
            globalConnectionCount -= 1;
            this.log(`${Constants.logPrefix}connection disconnected`);
            this.scheduleReconnect();
        });

        this.connection.on(Constants.events.error, (err) => {
            this.log(`${Constants.logPrefix}Error event triggered: ${err.info}, ${err.exception}`);
            console.error(err);
        });
    }

    connect(isReconnect) {
        this.connection.connect().then((state) => {
            this.log(`${Constants.logPrefix}${isReconnect ? 'Reconnected' : 'Connected'} to roomId ${state.roomId}, websocket: ${state.upgradedToWebsocket}`);

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
                this.emit(Constants.events.connectedForNotifyClient, state);
            }

        }).catch((err) => {
            this.log(`${isReconnect ? 'Reconnect' : 'Connection'} failed, ${err}`);

            if (isReconnect) {
                // Schedule the next reconnect attempt
                this.scheduleReconnect(err);
            } else {
                // Notify client
                this.emit(Constants.events.disconnectedForNotifyClient, err.toString());
            }
        });
    }
}

module.exports = {
    TikTokConnectionWrapper,
    getGlobalConnectionCount
};