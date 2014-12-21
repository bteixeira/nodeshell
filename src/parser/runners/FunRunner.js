var utils = require('../../utils');

var FunRunner = module.exports = function (fun) {
    this._fun = fun;
    this._stdio = [];
};

var p = FunRunner.prototype;

p.run = function (cb) {
    // todo piping
    var cfg, me = this;
    this.pipes = [];
    for (var i = 0; i < this._stdio.length; i++) {
        cfg = this._stdio[i];
        if (cfg === 'pipe') {
            this.pipes[i] = (function () {
                var j = i;
//                var buffer = new Buffer(1024);
//                var
                return {
//                    write: function (what) {
//                        buffer
//                    },
                    pipe: function (target) {
                        me.pipes[j] = target;
                    }
                };
            }());
        } else {
            this.pipes[i] = cfg;
        }
    }
    var result;
    setTimeout(function () {
        result = me._fun(me.pipes);
        cb(result);
    }, 0);

};

p.hasConfig = function (fd) {
    return typeof this._stdio[fd] !== 'undefined';
};

p.configFd = function (fd, config) {
    this._stdio[fd] = config;
};
