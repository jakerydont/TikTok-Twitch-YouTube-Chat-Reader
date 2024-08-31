const secret = require('./youtube-secret.json');
const { EventEmitter } = require('events');
const source = "youtube";
const ControlEvents = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RAWDATA: 'rawData',
  DECODEDDATA: 'decodedData',
  STREAMEND: 'streamEnd',
  WSCONNECTED: 'websocketConnected'
};

class YouTubeLiveChatReader extends EventEmitter {
  constructor(youTubeLiveVideoId, config) {
    super();
    this.youTubeLiveVideoId = youTubeLiveVideoId;
    //this.uniqueId = uniqueId;
    this.config = config;

    this.isConnected = false;
    this.cachedUsernameLookup = {};

    this.previousMessageIDs = [];
    this.pollInterval;
    try{
      this.pollInterval = config.youtube.pollInterval;
    }  catch {
      this.pollInterval = 5000
    }


    if (secret.apiKey == 'YourAPIKey') {
      console.error('YouTube: Seems you haven\'t supplied your API Key yet!');
      this.emit(ControlEvents.DISCONNECTED);
      return;
    }
    
  }

  async getState() {
    return {"isConnected" : this.isConnected}
  }

  async connect() {
    if (!this.youTubeLiveVideoId) {
      this.youTubeLiveVideoId = await this.getLiveVideoId();
    }
    if (!this.youTubeLiveVideoId) {
      this.youTubeLiveVideoId = this.config.youtube.liveVideoId;
    }

    this.chatId = await this.getChatId(this.youTubeLiveVideoId);
    this.pollForMessages = setInterval(() => {
      this.getChatMessages();
    }, this.pollInterval);
    this.isConnected = true;
    return {
      "youTubeLiveVideoId" : this.youTubeLiveVideoId,
      "chatId" :  this.chatId,
      "isConnected" : this.isConnected
    }
  }

  async disconnect() {
    this.isConnected = false;
    this.pollForMessages = null;
  }

  async getLiveVideoId() {
    var res = await fetch(
      //`https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastStatus=all&broadcastType=all&mine=true`
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${this.config.youtube.channelId}&key=${secret.apiKey}`
    );
  }

  async getUserName(userId) {

    let error;
    try {
      var res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${userId}&key=${secret.apiKey}`
      );

      var data = await res.json();

      if (!data.error) {
        if (!data.items.length == 0) {

          this.cachedUsernameLookup[data.items[0].id] = data.items[0].snippet.title;

          return data.items[0].snippet.title;
        } else {
          error = 'No users found.';
          throw error;
        }
      } else {
        error = data.error.code + ': ' + data.error.errors[0].reason;
        throw error;
      }
    } catch {
      console.log('Oops! ' + error + this.youTubeLiveVideoId);
    }
  }


  async getChatId(id) {
    let error;
    try {
      var res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&key=${secret.apiKey}&id=${id}`
      );

      var data = await res.json();

      if (!data.error) {
        if (!data.items.length == 0) {
          let livechatid = data.items[0].liveStreamingDetails.activeLiveChatId;
          console.log(livechatid);
          return livechatid;
        } else {
          error = 'LiveStream not found.';
          throw error;
        }
      } else {
        error = data.error.code + ': ' + data.error.errors[0].reason;
        throw error;
      }
    } catch(e) {
      console.log('Oops! ' + error );
    }
  }

  async getChatMessages() {
    let error;
    try {
      var res = await fetch(
        `https://www.googleapis.com/youtube/v3/liveChat/messages?part=id%2C%20snippet&key=${secret.apiKey}&liveChatId=${this.chatId}`
      );

      var data = await res.json();

      if (!data.error) {
        if (!data.items.length == 0) {
          let printedMessagesCount = 0;
          for (var i = 0; i < data.items.length; i++) {
            if (!this.previousMessageIDs.includes(data.items[i].id)) {
              this.previousMessageIDs.push(data.items[i].id);
              if (data.items[i].snippet.type == 'textMessageEvent') {

                let authorChannelId = data.items[i].snippet.authorChannelId;
                let authorChannelName = this.cachedUsernameLookup[authorChannelId];
                if (!authorChannelName) {
                  authorChannelName = await this.getUserName(authorChannelId);
                }
                let message = data.items[i].snippet.displayMessage;
                printedMessagesCount++;
                console.log("YOUTUBE: ", printedMessagesCount, authorChannelName, data.items[i].snippet.displayMessage);
                this.emit("chat", {source,authorChannelId,authorChannelName,message});
              }
              //console.log(data.items[i]);
            }


          }
          while (this.previousMessageIDs.length > data.items.length * 2) {
            this.previousMessageIDs.shift();
          }
          //console.log(` -- ${i} checking for more messages in ${pollInterval / 1000} seconds --`);
        } else {
          error = 'No messages.';
          throw error;
        }
      } else {
        error = data.error.code + ': ' + data.error.errors[0].reason;
        throw error;
      }
    } catch (error) {
      console.log('Oops! ' + error + " " + this.youTubeLiveVideoId);
    }
  }

}

module.exports= YouTubeLiveChatReader;