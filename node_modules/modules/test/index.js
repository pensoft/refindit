var cases = [];
exports.assert = function(expr, msg) {
	cases[cases.length] = { result:expr, message:msg };
};
exports.print = function(msg, type) {
	cases[cases.length] = { result:'fail'!==type, message:msg };
};
exports.report = function(name) {
	var div = global.document.createElement('div'), result,
		c, cc = cases.length, errors = 0, html = '';
	html += '<ol class="cases">';
	for (c = 0; c < cc; ++c) {
		if (!cases[c].result) { ++errors; }
		result = (cases[c].result ? 'pass' : 'fail');
		html += '<li class="' + result + '">' + result.toUpperCase() + ': ' + cases[c].message + '</li>';
	}
	html += '</ol>';
	div.innerHTML = name+': '+(cc-errors)+'/'+cc+' correct assertions' + html;
	div.className = 'report ' + (errors ? ' fail' : ' pass');
	div.tabIndex = 0; // make focusable
	global.document.body.appendChild(div);
	cases.length = errors.length = (count = 0); // reset stats
};


// if this is the main module, run all the test cases
if (module === require.main) {
	var tests = 'absolute,cyclic,determinism,exactExports,hasOwnProperty,method,missing,monkeys,nested,relative,transitive,variables'.split(',');
	(function run() {
		var name = tests.shift(), id = 'test/' + name + '/program'
		if (!name) { return; }
		require.ensure(id, function() {
			require(id);
			exports.report(name);
			run();
		});
	}());
}

