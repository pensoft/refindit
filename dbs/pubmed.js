/*jslint vars: true, devel: true */
/*global pubMedSimple: false, pubMedAdvanced: false, pubMedParse: false, requester: false */
"use strict";

module.exports = {
	stringFinder: pubMedSimple,
	objectFinder: pubMedAdvanced,
	stringParser: pubMedParse,
	objectParser: pubMedParse,
	requester: requester,
};

var url		 = require('url');
var xml2json = require('xml2js').parseString;
var p = require('../debug')().p;
var tools = require('./tools');
var path = tools.path;

function pubMedSimple(text, limit) {
	return url.format({
		protocol: 'http',
		host: 'eutils.ncbi.nlm.nih.gov',
		pathname: 'entrez/eutils/esearch.fcgi',
		query: {db: 'pubmed', term: text, retmax: limit}
	});
}

function query2(ids) {
	return url.format({
		protocol: 'http',
		host: 'eutils.ncbi.nlm.nih.gov',
		pathname: 'entrez/eutils/efetch.fcgi',
		query: { db: 'pubmed', rettype: 'medline', retmode: 'xml', id: ids }
	});
}

function pubMedAdvanced(query, limit) {
	var text = "";
	if (typeof query.author !== 'undefined') {
		text += query.author + '[auth]';
	}
	if (typeof query.year !== 'undefined') {
		text += query.year + '[pdat]';
	}
	if (typeof query.title !== 'undefined') {
		text += query.title + '[title]';
	}
	return pubMedSimple(text, limit);
}

function pubMedParse(xml) {
	var refTypes = {
		"journal article": 'journal article',
	};
	var common = [];
	xml2json(xml, {explicitArray: true}, function (err, result) {
		var res = path(result, ['PubmedArticleSet', 'PubmedArticle']);
		if (typeof res === 'undefined') {
			return [];
		}
		common = tools.safeMap(res, function (r) {
			var article = path(r, ['MedlineCitation', 0, 'Article', 0]);
			var articleIDs = path(r, ['PubmedData', 0, 'ArticleIdList', 0, 'ArticleId']);
			var auList = path(article, ['AuthorList', 0, 'Author']).filter(function (au) {
				return (typeof au.ForeName !== 'undefined' &&
						typeof au.LastName !== 'undefined');
			});
			var authors = tools.safeMap(auList, function (au) {
				return [path(au, ['ForeName', 0]),
						path(au, ['LastName', 0])];
			}, 'PubMed::Authors');
			var doi		= articleIDs.filter(function (articleID) { return articleID.$.IdType === 'doi'; });
			var pubmed	= articleIDs.filter(function (articleID) { return articleID.$.IdType === 'pubmed'; });
			var pmc		= articleIDs.filter(function (articleID) { return articleID.$.IdType === 'pmc'; });
			var doipath = path(doi, [0, '_']);
			var id		= {pubmed: path(pubmed, [0, '_']),
									pmc: path(pmc, [0, '_'])};
			var infoUrl = '';
			if (typeof id.pubmed !== "undefined") {
				infoUrl = 'http://www.ncbi.nlm.nih.gov/pubmed/' + id.pubmed;
			}
			if (typeof id.pmc !== "undefined") {
				infoUrl = 'http://www.ncbi.nlm.nih.gov/pmc/articles/' + id.pmc;
			}
			var abstr1 = path(article, ['Abstract', 0, 'AbstractText', 0, '_']);
			var abstr2 = path(article, ['Abstract', 0, 'AbstractText', 0]);
			var pagesStr  = path(article, ['Pagination', 0, 'MedlinePgn', 0]);
			var spage, epage,
			    pages = /([0-9]{1,}) *- *([0-9]{1,})/.exec(pagesStr);
			if (pages) {
				spage = pages[1];
				epage = pages[2];
			} else {
				spage = pagesStr;
			}
			var issueYear	= path(article, ['Journal', 0, 'JournalIssue', 0, 'PubDate', 0, 'Year', 0]);
			var articleYear = path(article, ['ArticleDate', 0, 'Year', 0]);
			return {
				source:			'PubMed',
				authors:		authors,
				doi:			doipath,
				href:			typeof doipath !== 'undefined' ? "http://dx.doi.org/" + doipath : undefined,
				title:			path(article, ['ArticleTitle', 0]),
				year:			articleYear || issueYear,
				publishedIn:	path(article, ['Journal', 0, 'Title', 0]),
				volume:			path(article, ['Journal', 0, 'JournalIssue', 0, 'Volume', 0]),
				issue:			path(article, ['Journal', 0, 'JournalIssue', 0, 'Issue', 0]),
				spage:			spage || undefined,
				epage:			epage,
				firstauthor:	authors[0] || [],
				editors:		undefined,
				fullCitation:	undefined,
				isParsed:		true,
				type:			refTypes[(path(article, ['PublicationTypeList', 0, 'PublicationType', 0]) || "").toLowerCase()],
				id:				id,
				infoUrl:		infoUrl,
				score:			undefined,
				abstract:		abstr1 || abstr2,
			};
		}, 'PubMed:: References');
	});
	return common;
}

function requester(finder, query, limit, parser, combiner, index) {
	var request1URL = finder(query, limit);
	var shame = function () { combiner([], index); };
	var request = require('request');
	request(request1URL, function (err1, res1, xml1) {
		tools.areWeOK(err1, res1, function (body) {
			xml2json(body, {explicitArray: true}, function (err, json1) {
				var ids = path(json1, ['eSearchResult', 'IdList', '0', 'Id']);
				if (typeof ids !== 'undefined') {
					request(query2(ids), function (err2, res2, xml2) {
						tools.areWeOK(err2, res2, function (body) {
							combiner(parser(body), index);
						}, shame);
					});
				} else {
					shame();
				}
			});
		}, shame);
	});
}