const Constants = {
    client: {
        logPrefix: 'CLIENT: ',
        events: {
            chat: 'clientChat'
        }
    },
    twitch: {
        logPrefix: 'TWITCH: ',
        events: {
            chat: 'twitchChat',
            setUniqueId: 'setTwitchId'
        },
        sourceIcon: 'twitchIcon.png'
    },
    youtube: {
        logPrefix: 'YOUTUBE: ',
        events: {
            setUniqueId: 'setYouTubeLiveVideoId'
        },
        sourceIcon: 'youtubeIcon.png'
    },
    tiktok: {
        logPrefix: 'TIKTOK: ',
        events: {
            setUniqueId: 'setUniqueId'
        },
        sourceIcon: 'tiktokIcon.png'
    },
};
module.exports = Constants;