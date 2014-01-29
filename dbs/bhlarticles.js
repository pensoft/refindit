/*jslint node: true, vars: true, white: true, devel: true*/
/*global bhlArticlesAdvanced: false, bhlArticlesParse: false */
"use strict";

module.exports = {
	objectFinder: bhlArticlesAdvanced,
	objectParser: bhlArticlesParse,
};

var tools = require('./tools');
var p = require('../debug')().p;

function bhlArticlesAdvanced(query) {
	return {
		protocol: 'http',
		host: 'www.biodiversitylibrary.org',
		pathname: '/api2/httpquery.ashx',
		query: {
			title: query.title,
			author: query.author,
			date: query.year,
			containerTitle: query.published_in,
			format: 'json',
			op: 'PartSearch',
			apikey: require('../config').bhlApiKey,
		}
	};
}

function bhlArticlesParse(body) {
	var references;
	try {
		references = JSON.parse(body).Result;
	} catch (e) {
		return [];
	}
	return tools.safeMap(references, function (ref) {
		var authors = tools.safeMap(ref.Authors, function(author){
			return tools.parseAuthorString(author.Name);
		}, 'bhlArticles::Authors');
		return {
			source:			'BHL articles',
			authors:		authors,
			doi:			ref.Doi,
			href:			ref.ExternalUrl || ('http://www.biodiversitylibrary.org/page/' + ref.StartPageID),
			title:			ref.Title,
			year:			(ref.Date || '').substring(0, 4) || undefined,
			publishedIn:	ref.ContainerTitle,
			volume:			ref.Volume,
			issue:			ref.Issue,
			spage:			ref.StartPageNumber,
			epage:			ref.EndPageNumber,
			firstauthor:	authors[0] || [],
			isParsed:		true,
			type:			ref.GenreName,
			id:				ref.PartID,
			infoUrl:		ref.PartUrl,
		};
	}, 'bhlArticles::References');
}