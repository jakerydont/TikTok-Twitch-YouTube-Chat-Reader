import BaseConnectionWrapper  from './BaseConnectionWrapper.js';
import YoutubeLiveChatReader from './YouTubeLiveChatReader.js';
import { youtubeConstants } from './constants.js';


let youTubeConnectionCount = 0;
class YouTubeConnectionWrapper extends BaseConnectionWrapper {
    constructor(youTubeLiveVideoId, options, enableLog) {
        super(youTubeLiveVideoId, options, enableLog, youtubeConstants);

        this.connection = new YoutubeLiveChatReader(youTubeLiveVideoId, options);

        this.connection.on(youtubeConstants.events.streamEnd, () => {
            this.log(`${youtubeConstants.logPrefix}streamEnd event received, giving up connection`);
            this.reconnectEnabled = false;
        });

        this.connection.on(youtubeConstants.events.disconnect, () => {
            youTubeConnectionCount -= 1;
            this.log(`${youtubeConstants.logPrefix}YouTube connection disconnected`);
            this.scheduleReconnect();
        });

        this.connection.on(youtubeConstants.events.error, (err) => {
            this.log(`${youtubeConstants.logPrefix}Error event triggered: ${err.info}, ${err.exception}`);
            console.error(err);
        });
    }

    connect(isReconnect) {
        this.connection.connect().then((state) => {
           
            this.log(`${isReconnect ? 'Reconnected' : 'Connected'} to roomId ${state.roomId}, websocket: ${state.upgradedToWebsocket}`);

            youTubeConnectionCount += 1;

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
                this.emit(youtubeConstants.events.connectedForNotifyClient, state);
            }

        }).catch((err) => {
            this.log(`${isReconnect ? 'Reconnect' : 'Connection'} failed, ${err}`);

            if (isReconnect) {
                // Schedule the next reconnect attempt
                this.scheduleReconnect(err);
            } else {
                // Notify client
                this.emit(youtubeConstants.events.disconnectedForNotifyClient, err.toString());
            }
        });
    }
}

export default YouTubeConnectionWrapper; 
export  const  getYouTubeConnectionCount = () => {
    return youTubeConnectionCount;
};