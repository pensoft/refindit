/*jslint node: true, vars: true, white: true, devel: true*/
"use strict";
var config = require('./config');
module.exports = function (trace_level) {
	return {
		p: function (printThis, tl, d) {
			if ((tl || 0) <= (trace_level || config.trace_level)) {
				console.log(require('util').inspect(printThis, {colors: true, depth: d}));
			}
		}
	};
};