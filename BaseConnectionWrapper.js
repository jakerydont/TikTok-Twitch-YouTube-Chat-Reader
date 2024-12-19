import { EventEmitter } from 'events';
import Abstractions from './Abstractions.js';

let globalConnectionCount = 0;

class BaseConnectionWrapper extends EventEmitter {
    constructor(uniqueId, options, enableLog, constants) {
        super();
        this.constants = constants;
        this.uniqueId = uniqueId;
        this.enableLog = enableLog;

        // Connection State
        this.clientDisconnected = false;
        this.reconnectEnabled = true;
        this.reconnectCount = 0;
        this.reconnectWaitMs = 1000;
        this.maxReconnectAttempts = 5;
    }

    connect(reconnect = false) {
        this.log(`${this.constants.logPrefix}Connecting... ${reconnect ? 'Reconnecting' : 'Initial connection'}`);
        // Placeholder implementation
        // Actual connection logic should be implemented here
    }

    scheduleReconnect(reason) {
        if (!this.reconnectEnabled) {
            return;
        }

        if (this.reconnectCount >= this.maxReconnectAttempts) {
            this.log(`${this.constants.logPrefix}Give up connection, max reconnect attempts exceeded`);
            this.emit('disconnected', `Connection lost. ${reason}`);
            return;
        }

        this.log(`Try reconnect in ${this.reconnectWaitMs}ms`);

        Abstractions.setTimeoutWrapper(() => {
            if (!this.reconnectEnabled || this.reconnectCount >= this.maxReconnectAttempts) {
                return;
            }

            this.reconnectCount += 1;
            this.reconnectWaitMs *= 2;
            this.connect(true);

        }, this.reconnectWaitMs);
    }



    disconnect() {
        this.log(`${this.constants.logPrefix}Client connection disconnected`);

        this.clientDisconnected = true;
        this.reconnectEnabled = false;

        if (this.connection.getState().isConnected) {
            this.connection.disconnect();
        }
    }

    log(logString) {
        if (this.enableLog) {
            console.log(`${this.constants.logPrefix} WRAPPER @${this.uniqueId}: ${logString}`);
        }
    }
}

export default BaseConnectionWrapper;
export const getConnectionCount = () => {
    return globalConnectionCount;
};