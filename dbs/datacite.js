/* jslint node: true */
/*global dataciteSimple: false, dataciteAdvanced: false, dataciteParse: false */
"use strict";

module.exports = {
	stringFinder: dataciteSimple,
	objectFinder: dataciteAdvanced,
	stringParser: dataciteParse,
	objectParser: dataciteParse,
	name: 'DataCite',
};

var p = require('../debug')().p;
var tools = require('./tools');

function dataciteSimple(text, limit) {
	return {
		protocol: 'http',
		host: 'search.datacite.org',
		pathname: '/api',
		query: {
			fl: 'doi,creator,title,publisher,publicationYear,alternateIdentifier,relatedIdentifier,resourceType',
			fq: 'is_active:true',
			rows: limit,
			wt: 'json',
			q: text,
		}
	};
}

function dataciteAdvanced(fields, limit) {
	var text = '';
	if (typeof fields.author !== 'undefined') {
		text += 'creator:' + fields.author + ' ';
	}
	if (typeof fields.year !== 'undefined') {
		text += 'publicationYear:' + fields.year + ' ';
	}
	if (typeof fields.title !== 'undefined') {
		text += 'title:' + fields.title + ' ';
	}
	if (typeof fields.published_in !== 'undefined') {
		text += 'publisher:' + fields.published_in + ' ';
	}
	return dataciteSimple(text, limit);
}

function dataciteParse(body) {
	var references = [];
	try {
		references = JSON.parse(body).response.docs;
	} catch (e) {
		return [];
	}

	return tools.safeMap(references, function (ref) {
		var authorsList = tools.safeMap(ref.creator, tools.parseAuthorString, 'DataCite::Authors');
		return {
			source:			'DataCite',
			authors:		authorsList,
			doi:			ref.doi,
			href:			'http://dx.doi.org/' + ref.doi,
			title:			ref.title[0],
			year:			ref.publicationYear,
			publishedIn:	ref.publisher,
			firstauthor:	authorsList[0] || [],
			isParsed:		true,
			id:				ref.alternateIdentifier,
			related:		parseRelations(ref.relatedIdentifier),
			type:			ref.resourceType,
			score:			undefined
		};
	}, 'DataCite::References');
}

function parseRelations(relations) {
	return tools.safeMap(relations, function (relation) {
		var id = /(\w*):(\w*):(.*)/.exec(relation);
		if (id !== null) {
			return {
				value: id[3],
				relation: id[1],
				idType: id[2],
			};
		}
	}, '');
}