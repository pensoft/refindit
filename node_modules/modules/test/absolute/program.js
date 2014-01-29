var test = require('test');
var a = require('test/absolute/submodule/a');
var b = require('test/absolute/b');
test.assert(a.foo().foo === b.foo, 'require works with absolute identifiers');
test.print('DONE', 'info');
