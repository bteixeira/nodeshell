var utils = require('./../../src/utils');

/**
 */
var StateMachine = module.exports = function () {
    this.handlers = {};
};

/**
 *
 */
StateMachine.prototype.on = function (state, pattern, cb) {
    var handlers = this.handlers[state];
    if (!handlers) {
        handlers = this.handlers[state] = [];
    }
    handlers.push({
        pattern: utils.isRegex(pattern) ? pattern : {
            test: function (other) {
                return other === pattern;
            }
        },
        callback: cb
    });
};

StateMachine.prototype.getHandler = function (t) {
    var handler;
    var handlers = this.handlers[this.state];
    handlers && handlers.every(function (h) {
        if (h.pattern.test(t)) {
            handler = h;
            return false; // break loop
        }
        return true; // continue loop
    });
    return handler; // might be undefined, it's your fault
};

StateMachine.prototype.EOF = {
    toString: function () {
        return '<EOF>';
    }
};

StateMachine.prototype.ANY = {
    toString: function () {
        return '<ANY>';
    }
};

StateMachine.prototype.stop = function () {
    this.stopped = true;
};

StateMachine.prototype.run = function () {
    var t;
    var handler;
    while (true) {
        if (this.hasMore()) {
            t = this.next();
        } else {
            t = this.EOF;
        }
        handler = this.getHandler(t);
        if (!handler) {
            handler = this.getHandler(this.ANY);
        }
        if (!handler) {
            throw 'Don\'t know what to do in ' + this.state + ' while seeing a [' + t + ']';
        }
        handler.callback.call(this, t);
        if (this.stopped) {
            return;
        }
        if (t === this.EOF) {
            return;
        }
    }
};
