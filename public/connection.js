/**
 * Wrapper for client-side TikTok connection over Socket.IO
 * With reconnect functionality.
 */
class connection {
    constructor(backendUrl) {
        this.socket = io(backendUrl);
        this.uniqueId = null;
        this.youTubeLiveVideoId = null;
        this.options = null;

        this.socket.on('connect', () => {
            console.info("Socket connected!");

            // Reconnect to streamer if uniqueId already set
            if (this.uniqueId) {
                this.setUniqueId();
            }

            if (this.youTubeLiveVideoId) {
                this.setYouTubeLiveVideoId();
            }
        })

        this.socket.on('disconnect', () => {
            console.warn("Socket disconnected!");
        })

        this.socket.on('streamEnd', () => {
            console.warn("LIVE has ended!");
            this.uniqueId = null;
        })

        this.socket.on('tiktokDisconnected', (errMsg) => {
            console.warn(errMsg);
            if (errMsg && errMsg.includes('LIVE has ended')) {
                this.uniqueId = null;
            }
        });
    }

    connect(uniqueId, options) {
        this.uniqueId = uniqueId;
        this.options = options || {};

        this.setUniqueId();

        return new Promise((resolve, reject) => {
            this.socket.once('tiktokConnected', resolve);
            this.socket.once('tiktokDisconnected', reject);

            setTimeout(() => {
                reject('Connection Timeout');
            }, 15000)
        })
    }

    youtubeConnect(youTubeLiveVideoId, options) {
        this.youTubeLiveVideoId = youTubeLiveVideoId;
        this.options = options || {};

        this.setYouTubeLiveVideoId();

        return new Promise((resolve, reject) => {
            this.socket.once('youTubeConnected', resolve);
            this.socket.once('youTubeDisconnected', reject);

            setTimeout(() => {
                reject('Connection Timeout');
            }, 15000)
        })
    }

    setUniqueId() {
        this.socket.emit('setUniqueId', this.uniqueId, this.options);
    }

    setYouTubeLiveVideoId() {
        this.socket.emit('setYouTubeLiveVideoId', this.youTubeLiveVideoId, this.options);
    }

    on(eventName, eventHandler) {
        this.socket.on(eventName, eventHandler);
    }
}

export default connection;