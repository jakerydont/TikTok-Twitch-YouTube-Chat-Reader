const https = require('https');
const opn = require('opn');
const fs = require('fs');
const { EventEmitter } = require('events');
const path = require('path');


const PubSub = require("./PubSub");
const TwitchIRC = require("./TwitchIRC");

class TwitchCom extends EventEmitter {
    constructor(myConfig, express, httpServer, webServer) {
        super();
        let config;
        if ((typeof myConfig) === 'string' ) {
            if (fs.existsSync(myConfig)) {
                config = JSON.parse(fs.readFileSync(myConfig).toString());
            }
        }

        this.clientDisconnected = false;
        this.reconnectEnabled = true;
        this.reconnectCount = 0;
        this.reconnectWaitMs = 1000;

        this.app = express;
        this.httpServer = httpServer;
        this.appClientID = config.twitch.appClientID;
        this.redirectUri = config.twitch.redirectUri;



        this.channelID = "";
        this.channelName = "";

        this.storedAccessToken = "";
        if (fs.existsSync("access_token.bin")) {
            this.storedAccessToken = fs.readFileSync("access_token.bin").toString();
        }

        this.loginResolve = null;

        this.webServerPort = config.twitch.callbackPort;
        this.webServer = webServer;
        //this.webServer.use(express.json());
        // this.webServer.get('/', (req, res) => {
        //     res.sendFile(path.resolve("public/index.html"));
        // })

        //this.httpServer.listen(this.webServerPort);

        this.config = config;


        /// set access token
        this.httpServer.post('/access_token', (req, res) => {
            if (this.loginResolve) {
                this.setAccessToken(req.body.access_token);

                this.validate(this.storedAccessToken).then(() => {
                    this.loginResolve();
                });
            }
        })

                /// set access token
        this.httpServer.post('/tokenCallback', (req, res) => {
            let body = []
            req.on('data', function(chunk) {
                //body.push(chunk);
            });
            req.on('readable', function()  {
                body.push(this.read());
            });
            req.on('end',  () => {
                if(!body) {
                    return;
                }
                let concatBody = JSON.parse(Buffer.from(body[0]).toString())
                if (this.loginResolve) {
                    this.setAccessToken(concatBody.access_token);
    
                    this.validate(this.storedAccessToken).then(() => {
                        this.loginResolve();
                    });
                }
                
            });





        })


    }

    connect() {
        if (this.loginResolve) {
            this.setAccessToken(req.body.access_token);

            this.validate(this.storedAccessToken).then(() => {
                this.loginResolve();
            });
        }
    }

    disconnect() {
        this.log(`Twitch client connection disconnected`);

        this.clientDisconnected = true;
        this.reconnectEnabled = false;

        if (this.connection.getState().isConnected) {
            this.connection.disconnect();
        }
    }

    setAccessToken(token) {
        this.storedAccessToken = token;
        fs.writeFileSync("access_token.bin", this.storedAccessToken);
    }

    validate(token) {
        const that = this;
        return new Promise(resolve => {

            console.log("Validating token...");
            const options = {
                hostname: "id.twitch.tv",
                port: 443,
                path: "/oauth2/validate",
                method: "GET",
                headers: {
                    "Authorization": "OAuth " + token
                }
            };
            const req = https.request(options, res => {
                if (res.statusCode == 401) {
                    // Invalid token
                    that.storedAccessToken = "";
                    that.login().then(() => {
                        resolve();
                    });
                }
                else if (res.statusCode >= 200 && res.statusCode < 203) {
                    console.log("Twitch authentication token has been validated");
                    // All good to go
                    let str = "";
                    res.on('data', function (chunk) {
                        str += chunk;
                    });
                    res.on('end', function () {
                        let obj = JSON.parse(str);
                        that.channelID = obj.user_id;
                        that.channelName = obj.login;
                        resolve();
                    });
                }
                else {
                    throw new Error("Unexpected response from Twitch. Twitch responded with " + res.statusCode + " upon token validation.");
                }
            });

            req.on('error', (e) => {
                throw new Error(e);
            });
            req.end();
        });
    }

    login() {
        return new Promise(resolve => {
            this.loginResolve = resolve;
            let scope = [
                "bits:read",
                "channel:read:subscriptions",
                "channel:read:redemptions",
                "channel_subscriptions",
                "chat:read"//,
                //"channel:moderate"
            ]
            //opn("https://id.twitch.tv/oauth2/authorize?client_id=" + encodeURI(this.appClientID) + "&redirect_uri=" + encodeURI(this.redirectUri + ":" + this.webServerPort) + "&response_type=token&scope=" + encodeURI(scope.join(' ')));
            opn("https://id.twitch.tv/oauth2/authorize?client_id=" + encodeURI(this.appClientID) + "&redirect_uri=" + encodeURI(this.redirectUri) + "&response_type=token&scope=" + encodeURI(scope.join(' ')));
        });
    }

    authenticate() {
        return new Promise(resolve => {
            if (this.storedAccessToken != null && this.storedAccessToken != "") {
                this.validate(this.storedAccessToken).then(() => {
                    resolve();
                });
            }
            else {
                this.login(). then(() => {
                    resolve();
                });
            }
        });
    }

    apiGetRequest(path) {
        const that = this;
        return new Promise(resolve => {
            const options = {
                hostname: "api.twitch.tv",
                port: 443,
                path: path,
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + that.storedAccessToken,
                    "Client-ID": this.appClientID
                }
            };
            const req = https.request(options, res => {
                if (res.statusCode == 401) {
                    // Invalid token
                    console.log("Failed to access API. Restart the Relay");

                    let str = "";
                    res.on('data', function (chunk) {
                        str += chunk;
                    });
                    res.on('end', function () {
                        let obj = JSON.parse(str);
                    });
                    /*
                    this.storedAccessToken = "";
                    this.login().then(() => {
                        resolve();
                    });*/
                }
                else if (res.statusCode >= 200 && res.statusCode < 203) {
                    // All good to go
                    let str = "";
                    res.on('data', function (chunk) {
                        str += chunk;
                    });
                    res.on('end', function () {
                        let obj = JSON.parse(str);
                        resolve(obj);
                    });
                }
                else {
                    throw new Error("Unexpected response from Twitch. Twitch responded with " + res.statusCode + " upon " + path + ".");
                }
            });

            req.on('error', (e) => {
                throw new Error(e);
            });
            req.end();
        });
    }

    tmiRequest(path) {
        // tmi.twitch.tv/group/user/andrelczyk/chatters
        const that = this;
        return new Promise(resolve => {
            const options = {
                hostname: "tmi.twitch.tv",
                port: 443,
                path: path,
                method: "GET"
            };
            const req = https.request(options, res => {
                if (res.statusCode == 401) {
                    // Invalid token
                    console.log("Failed to access API");

                    let str = "";
                    res.on('data', function (chunk) {
                        str += chunk;
                    });
                    res.on('end', function () {
                        let obj = JSON.parse(str);
                        console.log(obj);
                    });
                    /*
                    this.storedAccessToken = "";
                    this.login().then(() => {
                        resolve();
                    });*/
                }
                else if (res.statusCode >= 200 && res.statusCode < 203) {
                    // All good to go
                    let str = "";
                    res.on('data', function (chunk) {
                        str += chunk;
                    });
                    res.on('end', function () {
                        let obj = JSON.parse(str);
                        resolve(obj);
                    });
                }
                else {
                    throw new Error("Unexpected response from Twitch. Twitch responded with " + res.statusCode + " upon " + path + ".");
                }
            });

            req.on('error', (e) => {
                throw new Error(e);
            });
            req.end();
        });
    }

    connect(isReconnect) {
        this.authenticate().then(() => {
            console.log("Completed Twitch authentication");
            this.emit('twitchAuthenticated')

            let pubSub = new PubSub(this.config, this.storedAccessToken, this.channelID, this);
            pubSub.connect();

            let ircCom = new TwitchIRC(this.config, this.storedAccessToken, this.channelName, this);
            ircCom.connect();

            /*
            this.apiGetRequest("/helix/kraken/channel").then((data) => {
                console.log("helix get channel");
                console.log(data);
            });*/

        }).catch(() => {
            console.error(`${isReconnect ? 'Twitch Reconnect' : 'Twitch Connection'} failed, ${err}`);

            if (isReconnect) {
                // Schedule the next reconnect attempt
                // this.scheduleReconnect(err);
            } else {
                // Notify client
                this.emit('disconnected', err.toString());
            }
        });
    }
}

module.exports = TwitchCom;