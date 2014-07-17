/*jslint browser: true, vars: true, white: true, devel: true*/
"use strict";
/*global  $, callFormattingService*/
// UTILITIES

$('#styles').chosen().change(function (){ callFormattingService(this); });
var styles = $('#styles_chosen');

var old_ref;
var soFar = 0;
var inProgress = false;
var oReq = new XMLHttpRequest();
var previousQuery;

function p(printThis) { console.log(printThis); }

function empty(sth) { return typeof sth === 'undefined' || sth === "" || sth === null; }

function queryObj() {
    var result = {}, key, val, pairs = location.search.slice(1).split('&');
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        key = pair[0];
        val = pair[1];
        if (result.hasOwnProperty(key)) {
            if (Array.isArray(result[key])) {
                result[key].push(val);
            }
            else {
                result[key] = [result[key], val];
            }
        }
        else {
            result[key] = decodeURI(val) || '';
        }

    });
    return result;
}

// GUI
function noResults() {
	document.getElementById('results').innerHTML = '<div style="color: darkred; font-size: larger; margin-left: 250px">No results found.</div>';
	$('#results').show();
}

function stopRotation() {
	$('#simple').val('Simple search');
	$('#advanced').val('Advanced search');
	inProgress = false;
	$('body').css('cursor', 'default');
	$('.searching_gif').hide();
	$('.search_button').removeClass('blue_button');
}

function startRotation(type) {
	$('#'+type).val('Searching ...');
	$('#'+type).addClass('blue_button');
	$('#img_'+type).show();
	inProgress = true;
	$('body').css('cursor', 'progress');
}

function clear(form) {
	if (form === 'advanced') {
		$('#author').val('');
		$('#title' ).val('');
		$('#year'  ).val('');
		$('#origin').val('');
	} else {
		$('#q').val('');
	}
}

// SEARCH CLIENT
function formatAuthor(auNames) {
	return auNames.reduce(function (a, b) {return a + " " + b; }, "");
}

function formatAuthors(auList, author) {
	return auList + ((auList === '') ? '' :  ", ") + author;
}

function toString(obj, prefix, suffix) {
	return (empty(obj)) ? "" : prefix + obj + suffix;
}

function formatIdentifier(idType, idValue){
	switch(idType){
		case "URL":
			return '<a target="_blank" class="href" href="' + idValue + '">' + idValue + '</a>';
		    break;
		case "PURL":
			return '<a target="_blank" class="href" href="http://purl.org/' + idValue + '">PURL: ' + idValue + '</a>';
		    break;
		case "DOI":
			return '<a target="_blank" class="href" href="http://dx.doi.org/' + idValue + '">doi: ' + idValue + '</a>';
		    break;
		case "Handle":
			return '<a target="_blank" class="href" href="http://proxy.handle.net/' + idValue + '">handle: ' + idValue + '</a>';
		    break;
		case "PMID":
			return '<a target="_blank" class="href" href="http://www.ncbi.nlm.nih.gov/pubmed/' + idValue + '">PMID: ' + idValue + '</a>';
		    break;
		default:
    		return idType + ' ' + idValue;
	};
}

function formatResult(res) {
	var parsed = '';
	var source = '<div class="source ' + res.source.replace(' ', '') + '">' + res.source + "</div>";
	var dxdoi = 'http://dx.doi.org/';
	if (res.isParsed) {
		var authors = res.authors.map(formatAuthor).reduce(formatAuthors, "");
		var tooltip ='';
		var infoPageTitle = 'Info page';
		if (res.source === "PubMed") {
		  if (typeof res.id.pmc !== "undefined") {
		    infoPageTitle = 'Free PMC article';
		  }
		  tooltip = ' title="' + res.abstract + '" ';
		}
		var infoPage = toString(res.infoUrl, '<a target="_blank" class="info_page" href="', '">' + infoPageTitle + '</a>');
		if (res.source !== 'CrossRef' && res.source !== 'DataCite') {
			infoPage += toString(res.doi, ' <a target="_blank" class="info_page" href="http://' + window.location.host +  '/?search=simple&db=crossref&text=',  '">Find in CrossRef</a>');
		}
		if (typeof res.publishedIn === 'string'){
			var pubImg = res.publishedIn.toLowerCase();
			infoPage += '<img class="pubLogo ' + pubImg
				+'" alt="" title="'	+ res.publishedIn
				+'" src="/p/' + pubImg +'.png" onerror=\'this.style.display = "none"\'>';
		}

		var title = toString(res.title, '<br /><span class="title blue">', '</span><br/>');
		if (!empty(res.href)) {
			title = toString(res.title, '<br /><a class="title" ' + tooltip + ' target="_blank" href="' + res.href + '">', '</a><br/>');
		}
		if (!empty(res.doi)) {
			title = toString(res.title, '<br /><a class="title"' + tooltip + ' target="_blank" href="' + dxdoi + res.doi + '">', '</a><br/>');
		}

		parsed = title +
			toString(authors, '<span class="authors">', '</span>') +
			toString(res.year, ' (', ')');

		var id;
		for (id in res.ids) {
	        if (res.id.hasOwnProperty(id)) {
	            parsed += toString(res.ids.id, '<br/>', '');
	        }
		}

		var url = toString(res.href, '<br/><a class="href" href=' + res.href + ' target="_blank">', '</a>');
		if (!empty(res.doi)) {
			url = toString(dxdoi + res.doi, '<br/><a class="href" href=' + dxdoi + res.doi + ' target="_blank">', '</a>');
		}
		var related = '';
		if (typeof res.related !== 'undefined'){

			res.related.map(function(id){
				related += '<div class="relation">' + id.relation.replace(/([a-z](?=[A-Z]))/g, '$1 ').toLowerCase() + ' ';
				related += formatIdentifier(id.idType, id.value);
				related += '</div>';
			});
		}


		parsed +=
			toString(res.publishedIn, '<br/>', '') +
			toString(res.volume, ' ', '') +
			toString(res.issue, '(', ')') +
			toString(res.spage, ', ', '') +
			toString(res.epage, '-', '') +
			url + '<br>' +
			related;
		return parsed + source + infoPage;
	}
	return '<div class="plaintext">' + res.fullCitation + '</div>' + source;
}

function renderResult(res) {
	if (typeof res === 'string') {
		return '';
	}
	if (res.type === 'more_advanced') {
			return '<div class="more"><a href="/?search=advanced&limit='+ res.more +
				'&author=' + $('#author').val() +
				'&title=' + $('#title' ).val() +
				'&year=' + $('#year'  ).val() +
				'&origin=' + $('#origin').val() +
				'&db='+res.source.toLowerCase() + '">more results from ' + res.source + ' ››</a></div>';
	}
	if (res.type === 'more_simple') {
			return '<div class="more"><a href="/?search=simple&limit='+ res.more + '&text=' + $('#q').val() +'&db='+res.source.toLowerCase() + '">more results from ' + res.source + ' ››</a></div>';
	}
	var inner = formatResult(res);
	var unparsed = 'This reference is not parsed. <br>'
	+'<a href="http://vbrant.ipd.uka.de/RefBank/search?isFramePage=true&format=PaRsEtHeReF&id='+res.id+'" target="_blank">Parse reference</a>';
	var parsed = '<textarea class="hidden">' + encodeURIComponent(JSON.stringify(res)) + '</textarea>'
		+ '<select><option>-- select a citation style --</option></select>'
		+'<div class="formatted"></div>';
	var toolbox = res.isParsed ? parsed : unparsed;
	return '<div class="result clearfix">'
		+'<div class="ref">'+ inner +'</div>'
		+'	<div class="toolbox">'
		+		toolbox
		+'	</div>'
		+'</div>';
}

function attachDropdown(e) {
	var ref = $(e.currentTarget); //.parent();
	if (!ref.is(old_ref)) {
		var el = $(ref).find('select');
		if (typeof old_ref !== 'undefined') {
			$(old_ref).find('.toolbox .formatted').before('<select><option>-- select a citation style --</option></select>');
		}
		el.replaceWith(styles);
		old_ref = ref;
	}
}

function noInput(type){
	alert('you must type something ' + type);
}

function someDBsReady(response) {
	var responseText = response.currentTarget.responseText;
	var current = responseText.substring(soFar).replace(/\]\[/g, ',');
	if(current !== ''){
		var newRefs = '';
		try{
			newRefs = JSON.parse(current).map(renderResult).reduce(function (a, b) {return a + b; }, "");
			soFar = responseText.length;
		}
		catch(e){
			p(e);
		}
		document.getElementById('results').innerHTML += newRefs;
		$('#results').show();
		styles = $('#styles_chosen');
		$('.result').mouseenter(attachDropdown);
	}
}

function allDBsReady(response) {
	someDBsReady(response);
	if (response.currentTarget.responseText === '[]'){
		noResults();
	}
	stopRotation();
}

function doSearch(type, trigger) {
	var query	= '';
	var qStr = queryObj();
	var q		= '';
	var author	= '';
	var title	= '';
	var year	= '';
	var origin	= '';
	var limit, db;
	if (trigger === 'address') {
		limit	= qStr.limit;
		db		= qStr.db;
		if(type === 'simple'){
			$("#q").val(empty(qStr.text) ? '' : decodeURIComponent(qStr.text));
		}
		else{
			$("#author").val(empty(qStr.author) ? '' : decodeURIComponent(qStr.author));
			$("#title" ).val(empty(qStr.title)  ? '' : decodeURIComponent(qStr.title));
			$("#year"  ).val(empty(qStr.year)   ? '' : decodeURIComponent(qStr.year));
			$("#origin").val(empty(qStr.origin) ? '' : decodeURIComponent(qStr.origin));
		}
	}
	q		= $("#q").val();
	author	= $("#author").val();
	title	= $("#title" ).val();
	year	= $("#year"  ).val();
	origin	= $("#origin").val();
	var adv = 'search=advanced';
	if(type === 'simple'){
		if (!empty(q)){
			query = "search=simple&text=" + q;
			clear('advanced');
		}
	}
	else{
		if (!empty(author))	{ adv += '&author='	+ author;	}
		if (!empty(year))	{ adv += '&year='	+ year;		}
		if (!empty(title))	{ adv += '&title='	+ title;	}
		if (!empty(origin))	{ adv += '&origin='	+ origin;	}
		if (adv !== 'search=advanced'){
			query = adv;
		}
		clear('simple');
	}
	if (query === ''){
		noInput(type);
	}
	else{
		if (typeof db !== 'undefined') {
			if (Array.isArray(db)){
				db.forEach(function(d){
					query += '&db=' + d;
				});
			}
			else {
				query += '&db=' + db;
			}
		}
		if (typeof limit !== 'undefined') {
			query += '&limit=' + limit;
		}
		if (previousQuery !== query) {
			soFar = 0;
			previousQuery = query;
			startRotation(type);
			$('#styles_holder').append(styles);
			$("#results").html('');
			oReq.addEventListener("load",      allDBsReady, false);
			oReq.addEventListener("progress", someDBsReady, false);
			var api_call = 'http://' + window.location.host  +'/find?' + query;
			$('#queries').show();
			$('#api').attr('href', api_call);
			oReq.open("get", api_call + '&more=1', true);
			oReq.send();
		}
	}
	return false;
}

function callFormattingService(dropdown) {
	var style = dropdown.value.toLowerCase().replace(/ /g, '-');
	var ref   = $('#styles_chosen').prev().val();
	var textarea = $('#styles_chosen').next();
	var oReq  = new XMLHttpRequest();
		oReq.onload = function(){ textarea.html(this.responseText); };
		var server = 'http://' + window.location.host;
		oReq.open("get", server +'/format?ref=' + ref + '&style=' + style, true);
		oReq.send();
	return false;
}