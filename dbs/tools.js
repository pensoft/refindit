/*jslint node: true, nomen: true, vars: true, white: true*/
/*global parseAuthorString: false */
"use strict";
var p = require('../debug')().p;
module.exports = {
	areWeOK: function (err, res, great, shame) {
		if (err === null && res.statusCode === 200) {
			great.call(null, res.body);
		}
		else {
			shame.call();
			if (err === null) {
			p(('Warning: Request ' + res.req._headers.host + res.req.path), 1);
				p(('         failed with error: ' + res.statusCode + ' ' + require('http').STATUS_CODES[res.statusCode]), 1);
			}
			else{
				p((err), 1);
			}

		}
	},

	positive: function (val) {return val > 0 ? val : undefined; },

	parseCoins: function (coins) {
		//accepts a COinS string http://ocoins.info/
		//returns a js object representing the same info
		return require('querystring').parse(coins.replace(/&amp;/g, '&').replace(/&rft\./g, '&'));
	},

	safeMap: function (arr, func, objName) {
		if (Array.isArray(arr)) {
			return arr.map(func);
		}
		p('Warning: ' + objName + ' is not an array', 1);
		//console.trace();
		return [];
	},

	modsParseAuthor: function (author) {
		var nameParts = author.namePart;
		if (typeof nameParts === 'undefined') {
			return [];
		}
		if (typeof nameParts[0] === 'object') {
			var first = nameParts.filter(function (namepart) { return namepart.$.type === 'given' ; });
			var last  = nameParts.filter(function (namepart) { return namepart.$.type === 'family'; });
			return [first[0]._, last[0]._];
		}
		return module.exports.parseAuthorString(nameParts[0]);
	},

	parseAuthorString: function (text) {
		//accepts a string
		//returns an array
		text = text.trim();
		var firstlast = [
			/^([A-Z]\.[A-Z]\.[A-Z]\.)\s+([\S]+)$/,				//A.M.H. Brunsting
			/^(\S+\s+[A-Z]\.\s+[A-Z]\.)\s+([\S]+)$/,		//Artur R. M. Serrano
			/^([A-Z]\.\s+[A-Z]\.)\s+([\S]+)$/,		//J. P. Zaballos
			/^([A-Z]\.\-[A-Z]\.)\s+([\S]+)$/,		//S.-A. Bengtson
			/^([\S]+\s+[A-Z]\.)\s+([\S]+)$/,			//Carl H. Lindroth
			/^(\S+\s+\S+)\s+(\S+)$/,	//Carmen Chavez Ortiz
			/^([\S[^.,]]{2,})\s+([\S]{2,})$/,		//Lyubomir Penev
			/^([\S^.]\.)\,\s+([\S]+)$/,	//L., Penev
			/^([\S^.]\.)\s+([\S]+)$/,		//L. Penev
			/^(\S+)\s+([\S^\.]+)$/,			//M Baehr
		];

		var lastfirst = [

			/^([\S]+)\,\s+([A-Z]\.)$/,		//Penev, L.
			/^([\S]+)\,\s+([A-Z]\.\s*[A-Z]\.)$/,		//Vázquez, D. P.
			/^([^\s.,]+)\,\s*(.+)$/,	//PenevB, Lyubomir
			/^([^\s,.]+)\,\s+([A-Z])$/,		//Peneve, L
			/^([^\s.,]+)\s+\,,\s+([A-Z])$/,	//Penevf ,, L
			/^([^\s]+)\s+([A-Z]\.)$/,		//Penevc L.
			];
		var i, n, lst, l;
		for (i = 0, n = lastfirst.length; i < n; i+=1) {
			if (lastfirst[i].test(text)){
				//p(lastfirst[i])
				//p(text)
				lst = lastfirst[i].exec(text);
				l = lst.length;
				var first = lst.slice(2, l);
				var last = lst[1];
				return first.concat(last);
			}
		}
		for (i = 0, n = firstlast.length; i < n; i+=1) {
			if (firstlast[i].test(text)){
				//p(firstlast[i])
				//p(text)
				lst = firstlast[i].exec(text);
				l = lst.length;
				return lst.slice(1, l);
			}
		}
		return [text];
	},

	path: function (obj, propertyList) {
		var i, n;
		for (i = 0, n = propertyList.length; i < n; i+=1) {
			if (typeof obj === 'undefined') {
				return undefined;
			}
			if (Array.isArray(propertyList[i])) {
				if (obj.$[propertyList[i][0]] !== propertyList[i][1]) {
					return undefined;
				}
			}
			else {
				obj = obj[propertyList[i]];
			}
		}
		return obj;
	},
};
