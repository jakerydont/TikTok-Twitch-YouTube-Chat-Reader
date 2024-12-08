const Constants = {
    client: {
        logPrefix: 'CLIENT: ',
        events: {
            connected: 'clientConnected',
            chat: 'clientChat'
        }
    },
    twitch: {
        logPrefix: 'TWITCH: ',
        events: {
            connected: 'twitchConnected',
            chat: 'twitchChat',
            setUniqueId: 'setTwitchId'
        },
        sourceIcon: 'twitchIcon.png'
    },
    youtube: {
        logPrefix: 'YOUTUBE: ',
        events: {
            connectedForNotifyClient: 'youtubeConnected',
            disconnectedForNotifyClient: 'youtubeDisconnected',
            connected: 'youtubeConnected',
            setUniqueId: 'setYouTubeLiveVideoId'
        },
        sourceIcon: 'youtubeIcon.png'
    },
    tiktok: {
        logPrefix: 'TIKTOK: ',
        events: {
            connectedForNotifyClient: 'tiktokConnected',
            disconnectedForNotifyClient: 'tiktokDisconnected',
            // these event names are hard-coded in the tiktok-live-connector library
            // and cannot be customized
            connected: 'connected',
            disconnected: 'disconnected',
            error: 'error',
            rawData: 'rawData',
            decodedData: 'decodedData',
            streamEnd: 'streamEnd',
            websocketConnected: 'websocketConnected'
        },
        
        sourceIcon: 'tiktokIcon.png'
    },
};
module.exports = Constants;