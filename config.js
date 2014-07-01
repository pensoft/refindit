/*jslint nomen: true */
"use strict";

//Development or Production
var dev = true;

module.exports = {
// GENERAL SETTINGS
	modules: [
		'search',		// Unified search service
		'format',		// Format service
		'websrv',		// Static files web server
		'tester',		// sanity checks
	],
	initModules: function (app) {
		this.modules.map(function (moduleName) {
			require('./' + moduleName)(app);
		});
	},
	port: 5000,
	apidoc:			__dirname + '/client/API.txt',
	trace_level:	1,

// SEARCH MODULE
	limit: 5,
	more: 30,
	// Note: BHL, Mendeley and CrossRef advanced search require a free
	// API key to work and are commented out.
	// See below for links to obtain the keys.
	simpleDBs: [
		'crossref',
		'datacite',
		'pubmed',
		'refbank',
		'gnub',
		//'mendeley'
	],
	advancedDBs: [
		//'crossref',
		'datacite',
		'pubmed',
		'refbank',
		//'bhlarticles',
		//'bhlbooks',
		//'mendeley'
	],
	refBankHost:	'vbrant.ipd.uka.de',
	gnubHost:		'zoobank.org',
//	bhlApiKey:		'http://www.biodiversitylibrary.org/getapikey.aspx',
//	mendeleyApiKey: 'http://dev.mendeley.com/applications/register/',
//	crossrefApiKey: 'http://www.crossref.org/requestaccount/',
	filter: function (a) { return a.isParsed; },

// FORMAT MODULE
	stylesPath:		__dirname + '/format/csl/',
	localesPath:	__dirname + '/format/csl-locales/',

// WEBSRV MODULE
	maxAge:			dev ? 0 : 86400000,
	clientPath:		__dirname + '/client',

// TESTER MODULE
	modules2test:	[
		'search',
		//'format',
		'websrv'
	],

};