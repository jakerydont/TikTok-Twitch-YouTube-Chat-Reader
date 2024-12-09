
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
            expect(consoleLogStub.args[0][0]).to.equal('WRAPPER @uniqueId: test log');      });

        it('should not log messages when enableLog is false', () => {
            const consoleLogStub = stub(console, 'log');
            wrapper.enableLog = false;
            wrapper.log('test log');
            expect(consoleLogStub.called).to.be.false;
        });

        it('should emit disconnected event after max reconnect attempts', (done) => {
            wrapper.maxReconnectAttempts = 1;
            wrapper.on('disconnected', (message) => {
                expect(message).to.equal('Connection lost. test reason');
                done();
            });
            wrapper.scheduleReconnect('test reason');
        });

        it('should schedule reconnect with exponential backoff', (done) => {
            const clock = useFakeTimers();
            wrapper.connect = stub();
            wrapper.scheduleReconnect('test reason');
            expect(setTimeout.called).to.be.true;
            expect(setTimeout.args[0][1]).to.equal(1000);
            
            
            clock.tick(1000);
            expect(wrapper.connect.called).to.be.true;
            expect(wrapper.connect.called.args[0][0]).to.be.true;
            expect(wrapper.reconnectCount).to.equal(1);
            expect(wrapper.reconnectWaitMs).to.equal(2000);
            clock.restore();
            done();
        });

        it('should disable reconnect and set clientDisconnected on disconnect', () => {
            wrapper.connection = { getState: stub().returns({ isConnected: true }), disconnect: stub() };
            wrapper.disconnect();
            expect(wrapper.clientDisconnected).to.be.true;
            expect(wrapper.reconnectEnabled).to.be.false;
            expect(wrapper.connection.disconnect.called).to.be.true;
        });
    });
