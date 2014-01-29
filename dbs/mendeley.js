/* jslint node: true */
/*global mendeleySimple: false, mendeleyAdvanced: false, mendeleyParse: false, empty: false */
"use strict";

module.exports = {
	stringFinder: mendeleySimple,
	objectFinder: mendeleyAdvanced,
	stringParser: mendeleyParse,
	objectParser: mendeleyParse,
};

var p = require('../debug')().p;
var tools = require('./tools');

function mendeleySimple(text, limit) {
	return {
		protocol: 'http',
		host: 'api.mendeley.com',
		pathname: 'oapi/documents/search/' + text.replace(/ /g, '%20') + '/',
		query: { consumer_key: require('../config').mendeleyApiKey, items: limit, page: 0}
	};
}

function mendeleyAdvanced(fields, limit) {
	var text = '';
	if (typeof fields.author !== 'undefined') {
		text += 'author:' + fields.author + ' ';
	}
	if (typeof fields.year !== 'undefined') {
		text += 'year:' + fields.year + ' ';
	}
	if (typeof fields.title !== 'undefined') {
		text += 'title:' + fields.title + ' ';
	}
	if (typeof fields.published_in !== 'undefined') {
		text += 'published_in:' + fields.published_in + ' ';
	}
	return mendeleySimple(text, limit);
}

function mendeleyParse(body) {
	var references;
	try {
		references = JSON.parse(body).documents || [];
	} catch (e) {
		return [];
	}
    return tools.safeMap(references, function (ref) {
		var authors = tools.safeMap(ref.authors, function (au) {return [au.forename, au.surname]; }, 'Mendeley::Authors');
		return {
			source:			'Mendeley',
			authors:		authors,
			doi:			ref.doi,
			href:			!empty(ref.doi) ? "http://dx.doi.org/" + ref.doi : undefined,
			title:			ref.title,
			year:			ref.year,
			publishedIn:	ref.publication_outlet,
			firstauthor:	authors[0] || [],
			isParsed:		true,
			id:				{mendeley: ref.uuid},
			infoUrl:		ref.mendeley_url,
		};
	}, 'Mendeley::References');
}

function empty(sth) { return typeof sth === 'undefined' || sth === "" || sth === null; }