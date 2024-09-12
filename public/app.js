import Connection from './connection.js'

// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new Connection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    $('#tiktokConnectButton').click(tiktokConnect);
    $('#tiktokUniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            tiktokConnect();
        }
    });
        if (window.settings.username) tiktokConnect();

    $('#youTubeConnectButton').click(youTubeConnect);
    $('#youTubeLiveVideoIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            youTubeConnect();
        }
    });

    $("#twitchAuthenticate").click(twitchAuthenticate);

    if(window.settings.youTubeLiveVideoId) youTubeConnect();
})

function tiktokConnect() {
    let tiktokUniqueId = window.settings.username || $('#tiktokUniqueIdInput').val();
  
    if ( tiktokUniqueId !== '' ) {

        $('#tiktokStateText').text('Connecting...');

        connection.connect(tiktokUniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#tiktokStateText').text(`Connected to roomId ${state.roomId}`);

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateTiktokRoomStats();

        }).catch(errorMessage => {
            $('#tiktokStateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    tiktokConnect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert('no tiktok username entered');
    }
}

function youTubeConnect() {
    let youTubeLiveVideoId = window.settings.youTubeLiveVideoId || $('#youTubeLiveVideoIdInput').val();
    if (  youTubeLiveVideoId !== '' ) {

        $('#youTubeStateText').text('Connecting...');
        connection.youtubeConnect(youTubeLiveVideoId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#youTubeStateText').text(`Connected to chatId ${state.chatId}`);

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateYouTubeRoomStats();

        }).catch(errorMessage => {
            $('#youTubeStateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.youTubeLiveVideoId) {
                setTimeout(() => {
                    youTubeConnect(window.settings.youTubeLiveVideoId);
                }, 30000);
            }
        })

    } else {
        alert('no youtube username entered');
    }
}

function twitchAuthenticate() {
    connection.twitchAuthenticate().then(state => {
        console.log(state)
    })  
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateTiktokRoomStats() {
    $('#tiktokRoomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Earned Diamonds: <b>${diamondsCount.toLocaleString()}</b>`)
}

function updateYouTubeRoomStats() {
    console.warn('updateYouTubeRoomStats() not implemented');
    //$('#youTubeRoomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Earned Diamonds: <b>${diamondsCount.toLocaleString()}</b>`)
}

function generateUsernameLink(data) {
    return `TIKTOK <a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function generateYouTubeUsernameLink(data) {
    return `YOUTUBE <a class="usernamelink" href="https://www.youtube.com/@${data.authorChannelName}" target="_blank">${data.authorChannelName}</a>`;
}

function generateTwitchUsernameLink(data) {
    let username = "some username";
    //return `TWITCH <a class="usernamelink" href="https://www.youtube.com/@${data.authorChannelName}" target="_blank">${data.authorChannelName}</a>`;
    return `TWITCH ${username}`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new message to the chat container
 */
function addChatItem(originColor, data, originText, summarize) {
    let text = originText;
    let color = originColor;
    let usernameLink;
    if (data.source === "youtube") {
        text = data.message;
        //color = 'red';
        usernameLink = generateYouTubeUsernameLink(data);
    } else {
        data.source = "tiktok"
        usernameLink = generateUsernameLink(data);
    }
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();;

    container.append(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${usernameLink}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
            </span>
        </div>
    `);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
}

/**
 * Add a new gift to the gift container
 */
function addGiftItem(data) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Repeat: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                            </td>
                        </tr>
                    </tabl>
                </div>
            </span>
        </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
    }

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}


// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateTiktokRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateTiktokRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`))
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#21b2c2', msg, 'joined', true);
    }, joinMsgDelay);
})

// New chat comment received
connection.on('chat', (data) => {
    if (window.settings.showChats === "0") return;

    addChatItem('', data, data.comment);
})

// New gift received
connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateTiktokRoomStats();
    }

    if (window.settings.showGifts === "0") return;

    addGiftItem(data);
})

// share, follow
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

connection.on('streamEnd', () => {
    $('#tiktokStateText').text('Stream ended.');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            tiktokConnect(window.settings.username);
        }, 30000);
    }
})

