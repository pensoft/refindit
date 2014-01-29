/*jslint vars: true */
/*global crossRefSimple: false, crossRefAdvanced: false, crossRefParse: false, crossRefParseSingle: false, crossRefAdvancedParse: false */
"use strict";

module.exports = {
	stringFinder: crossRefSimple,
	objectFinder: crossRefAdvanced,
	stringParser: crossRefParse,
	objectParser: crossRefAdvancedParse,
};

var tools = require('./tools');
var p = require('../debug')().p;

function crossRefSimple(text, limit) {
	return {
		protocol: 'http',
		host: 'search.crossref.org',
		pathname: '/dois',
		query: {page: 1, rows: limit, q: text, }
	};
}

function crossRefAdvanced(query) {
	var email = require('../config').crossrefApiKey;
	var xml = '<?xml version="1.0" encoding="UTF-8"?>'
			+ '<query_batch version="2.0" xsi:schemaLocation="http://www.crossref.org/qschema/2.0 http://www.crossref.org/qschema/crossref_query_input2.0.xsd" xmlns="http://www.crossref.org/qschema/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
			+ '<head>'
			+ '	<email_address>' + email + '</email_address>'
			+ '	<doi_batch_id>ABC_123_fff</doi_batch_id>'
			+ '</head>'
			+ '<body>'
			+ '	<query enable-multiple-hits="multi_hit_per_rule">';
	if (typeof query.author !== 'undefined') {
		xml += '<author>' + query.author + '</author>';
	}
	if (typeof query.year !== 'undefined') {
		xml += '<year>' + query.year + '</year>';
	}
	if (typeof query.title !== 'undefined') {
		xml += '<article_title>' + query.title + '</article_title>';
	}
	if (typeof query.published_in !== 'undefined') {
		xml += '<journal_title>' + query.published_in + '</journal_title>';
	}
	xml += '</query></body></query_batch>';
	return {
		protocol: 'http',
		host: 'doi.crossref.org',
		pathname: '/servlet/query',
		query: {
			format: 'unixref',
			pid: email,
			qdata: xml
		}
	};
}

function coinsAuthors(coins) {
	if (typeof coins.au === "string") {
		return [[coins.aufirst, coins.aulast]];
	}
	return tools.safeMap(coins.au, tools.parseAuthorString, 'CrossRef::Authors');
}

function crossRefParse(body) {
	var references;
	try {
		references = JSON.parse(body);
	} catch (e) {
		return [];
	}
	return tools.safeMap(references, crossRefParseSingle, 'CrossRef::References');
}

function crossRefParseSingle(ref) {
	var coins = tools.parseCoins(ref.coins);
	var refTypes = {
		book:		'book',
		bookitem:	'book chapter',
		conference: 'conference paper',
		proceeding: 'conference proceedings',
		article:	'journal article',
	};
	return {
		source:			'CrossRef',
		authors:		coinsAuthors(coins),
		doi:			ref.doi.substring(18),
		href:			ref.doi,
		title:			ref.title || coins.atitle,
		year:			coins.date,
		publishedIn:	coins.jtitle,
		volume:			tools.positive(coins.volume),
		issue:			tools.positive(coins.issue),
		spage:			coins.spage,
		epage:			coins.epage,
		firstauthor:	[coins.aufirst, coins.aulast],
		editors:		undefined,
		fullCitation:	ref.fullCitation,
		isParsed:		true,
		type:			refTypes[(coins.genre || "").toLowerCase()],
		id:				ref.doi.substring(18),
		score:			ref.score,
	};
}

function crossRefAdvancedParse(xml) {
	var common = [];
	var xml2json = require('xml2js').parseString;
	xml2json(xml, function (err, result) {
		var path = tools.path;
		if (typeof path(result, ['doi_records', 'doi_record', 0, 'crossref', 0, 'error']) === 'undefined') {
			common = tools.safeMap(path(result, ['doi_records', 'doi_record']), function (res) {
				var ref = path(res, ['crossref', 0, 'journal', 0]);
				if (typeof ref === 'undefined') {
					return {};
				}
				var au = path(ref, ['journal_article', 0, 'contributors', 0, 'person_name']);
				var authorNames = tools.safeMap(au, function (author) {
						return [author.given_name, author.surname];
					}, 'CrossRefA::Authors');
				return {
					source:			'CrossRef',
					authors:		authorNames,
					doi:			path(ref, ['journal_article', 0, 'doi_data', 0, 'doi']),
					href:			path(ref, ['journal_article', 0, 'doi_data', 0, 'resource']),
					title:			path(ref, ['journal_article', 0, 'titles', 0, 'title']),
					year:			path(ref, ['journal_issue', 0, 'publication_date', 0, 'year']),//Year, regular expression numbers only
					publishedIn:	path(ref, ['journal_metadata', 0, 'full_title']),
					volume:			path(ref, ['journal_issue', 0, 'journal_volume', 0, 'volume']),
					issue:			tools.positive(path(ref, ['journal_issue', 0, 'issue'])),
					spage:			path(ref, ['journal_article', 0, 'pages', 'first_page']),
					epage:			undefined,
					firstauthor:	authorNames[0] || [],
					isParsed:		true,
					type:			undefined,
					id:				undefined,
					infoUrl:		undefined,
					score:			undefined,
				};
			}, 'CrossRefA::References');
		}
	});
	return common;
}