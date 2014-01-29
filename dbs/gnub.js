/* jslint node: true */
/*global gnubSimple: false, gnubParse: false */
"use strict";

module.exports = {
	stringFinder: gnubSimple,
	stringParser: gnubParse,
};

var p = require('../debug')().p;
var tools = require('./tools');

function gnubSimple(text, limit) {
	return {
		protocol: 'http',
		host: require('../config').gnubHost,
		pathname: '/References.json',
		query: {top: limit, search_term: text, }
	};
}

function gnubParse(body) {
	var refTypes = {
		'book':						'book',
		'book section':				'book chapter',
		'conference proceedings':	'conference proceedings',
		'journal article':			'journal article',
	}, references = [];

	try {
		references = JSON.parse(body);
	} catch (e) {
		return [];
	}

	return tools.safeMap(references.filter(function (r) {return r.referenceuuid !== ''; }), function (ref) {
		var authorsList = tools.safeMap(ref.authors, function (author) {
			return [author[0].givenname, author[0].familyname];
		}, 'GNUB::Authors');
		return {
			source:			'GNUB',
			authors:		authorsList,
			doi:			ref.doi,
			href:			'http://zoobank.org/' + ref.referenceuuid,
			title:			ref.title,
			year:			ref.year,
			publishedIn:	ref.parentreference,
			volume:			ref.volume,
			issue:			ref.number,
			spage:			ref.startpage,
			epage:			ref.endpage,
			firstauthor:	authorsList[0] || [],
			fullCitation:	ref.label || ref.value,
			isParsed:		true,
			type:			refTypes[(ref.referencetype || "").toLowerCase()],
			id:				{
				zoobank: ref.lsid,
				uuid: ref.referenceuuid
			},
			score:			undefined
		};
	}, 'GNUB::References');
}