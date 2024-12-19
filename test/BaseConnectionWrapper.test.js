import { expect } from 'chai';
import BaseConnectionWrapper from '../BaseConnectionWrapper.js';
import { EventEmitter } from 'events';
import { restore, stub, useFakeTimers } from 'sinon';

describe('BaseConnectionWrapper', () => {
    let wrapper = new BaseConnectionWrapper('uniqueId', {}, true);
    let uniqueId = 'test-id';
    let options = {};
    let enableLog = false;

    beforeEach(() => {
        wrapper = new BaseConnectionWrapper('uniqueId', {}, true);
    });

    afterEach(() => {
        restore();
    });

    it('should initialize with correct properties', () => {
        expect(wrapper.uniqueId).to.equal('uniqueId');
        expect(wrapper.enableLog).to.be.true;
        expect(wrapper.clientDisconnected).to.be.false;
        expect(wrapper.reconnectEnabled).to.be.true;
        expect(wrapper.reconnectCount).to.equal(0);
        expect(wrapper.reconnectWaitMs).to.equal(1000);
        expect(wrapper.maxReconnectAttempts).to.equal(5);
    });

    it('should log messages when enableLog is true', () => {
        const consoleLogStub = stub(console, 'log');
        wrapper.enableLog = true;
        wrapper.log('test log');
    
        expect(consoleLogStub.called).to.be.true;
        expect(consoleLogStub.args[0][0]).to.equal('WRAPPER @uniqueId: test log');
    });

    it('should not log messages when enableLog is false', () => {
        const consoleLogStub = stub(console, 'log');
        wrapper.enableLog = false;
        wrapper.log('test log');
        expect(consoleLogStub.called).to.be.false;
    });

    it('should disable reconnect and set clientDisconnected on disconnect', () => {
        wrapper.connection = { getState: stub().returns({ isConnected: true }), disconnect: stub() };
        wrapper.disconnect();
        expect(wrapper.clientDisconnected).to.be.true;
        expect(wrapper.reconnectEnabled).to.be.false;
        expect(wrapper.connection.disconnect.called).to.be.true;
    });

    it('should attempt to reconnect when scheduleReconnect is called', () => {
        const clock = useFakeTimers();
        const connectStub = stub(wrapper, 'connect');
        wrapper.scheduleReconnect('test reason');
        clock.tick(wrapper.reconnectWaitMs);
        expect(connectStub.calledWith(true)).to.be.true;
        clock.restore();
    });

    it('should not attempt to reconnect if reconnect is disabled', () => {
        const connectStub = stub(wrapper, 'connect');
        wrapper.reconnectEnabled = false;
        wrapper.scheduleReconnect('test reason');
        expect(connectStub.called).to.be.false;
    });

    it('should emit disconnected event after max reconnect attempts', () => {
        const emitStub = stub(wrapper, 'emit');
        wrapper.reconnectCount = wrapper.maxReconnectAttempts;
        wrapper.scheduleReconnect('test reason');
        expect(emitStub.calledWith('disconnected', 'Connection lost. test reason')).to.be.true;
    });

    it('should double the reconnect wait time on each attempt', () => {
        const clock = useFakeTimers();
        const connectStub = stub(wrapper, 'connect');
        wrapper.scheduleReconnect('test reason');
        clock.tick(wrapper.reconnectWaitMs);
        expect(wrapper.reconnectWaitMs).to.equal(2000);
        clock.restore();
    });

    it('should reset reconnect count and wait time on successful connect', () => {
        wrapper.reconnectCount = 3;
        wrapper.reconnectWaitMs = 4000;
        wrapper.connect();
        expect(wrapper.reconnectCount).to.equal(0);
        expect(wrapper.reconnectWaitMs).to.equal(1000);
    });
});
