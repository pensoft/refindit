/*jslint node: true, vars: true, white: true, devel: true*/
/*global bhlBooksAdvanced: false, bhlBooksParse: false */
"use strict";
var tools = require('./tools');
var p = require('../debug')().p;

module.exports = {
	objectFinder: bhlBooksAdvanced,
	objectParser: bhlBooksParse,
};

function bhlBooksAdvanced(query) {
	return {
		protocol: 'http',
		host: 'www.biodiversitylibrary.org',
		pathname: '/api2/httpquery.ashx',
		query: {
			title: query.title,
			lname: query.author,
			date: query.year,
			containerTitle: query.published_in,
			format: 'json',
			op: 'BookSearch',
			apikey: require('../config').bhlApiKey,
		}
	};
}

function bhlBooksParse(body) {
	var references;
	try {
		references = JSON.parse(body).Result;
	} catch (e) {
		return [];
	}
    return tools.safeMap(references, function (ref) {
		var authors = tools.safeMap(ref.Authors, function(author){
			return tools.parseAuthorString(author.Name);
		}, 'bhlBooks::Authors');
		return {
			source:			'BHL books',
			authors:		authors,
			doi:			ref.Doi,
			href:			ref.ExternalUrl || ref.Items[0].ItemUrl,
			title:			ref.FullTitle,
			year:			(ref.PublicationDate || '').substring(0, 4) || undefined,
			publishedIn:	ref.PublisherName,
			volume:			ref.Items[0].Volume,
			issue:			ref.Issue,
			spage:			ref.StartPageNumber,
			epage:			ref.EndPageNumber,
			firstauthor:	authors[0] || [],
			isParsed:		true,
			type:			'book',
			id:				ref.TitleID,
			infoUrl:		ref.TitleUrl,
		};
	}, 'bhlBooks::References');
}