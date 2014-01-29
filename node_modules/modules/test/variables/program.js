var test = require('test');
test.assert(global === this, 'global aliases this');
test.assert('object' === typeof exports && exports === module.exports, 'exports aliases module.exports');
test.assert(require(module.id) === exports, 'require(module.id) returns exports');

exports = module.exports = { bar:'baz' };
test.assert(require(module.id) === exports && 'baz' === require(module.id).bar, 'assign to module.exports');

test.print('DONE', 'info');
