var test = require('test');
var a = require('./a');
var b = require('./b');

test.assert(a.a, 'a exists');
test.assert(b.b, 'b exists')
test.assert(a.a().b === b.b, 'a gets b');
test.assert(b.b().a === a.a, 'b gets a');

exports.a = a;
test.assert(require(module.id).a && !require(module.id).b, 'partial export available');
exports.b = b;
test.assert(require(module.id).a && require(module.id).b, 'export is updated properly');

test.print('DONE', 'info');
