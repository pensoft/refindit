(function(global){
	'use strict';

	var doc = global.document, modules = {}, defs = {}, path, ext = '.js', buns, bunsMap = {},
		area = doc.createElement('textarea'), main = doc.getElementById('require-script'),
		READONLY = { enumerable:true, writable:false, configurable:false },
		defineProperties = Object.defineProperties || function(){};
	if (!defineProperties({ test:true }, { test:READONLY }).test) { defineProperties = function(){}; } // detect disfunction

	function decode(s) { area.innerHTML = String(s); return area.value; }
	path = main && decode(main.src).replace(/[^\/\\]*$/, '');
	buns = JSON.parse(main && decode(main.getAttribute('data-bundles'))) || {};
	main = main && decode(main.getAttribute('data-main') || '') || false;
	function ready() { ensure(main, 0, function() { require(main); }); }
	if (main) {
		if (doc.readyState !== 'loading') { setTimeout(ready, 1); }
		else if (!doc.addEventListener) { global.attachEvent('load', ready); }
		else { doc.addEventListener('DOMContentLoaded', ready); }
	}

	function define(id, fn) { defs[id] = fn; }
	define.map = function(o) { for (var m in o) { define(m, o[m]); } };
	if (global.define) { define.map(global.define.defs); } // there were bundles loaded before now.

	function defineBundle(id, bundle) {
			buns[id] = bundle;
			var modules = bundle.modules, m, mm = modules.length;
			for (m = 0; m < mm; ++m) { bunsMap[modules[m]] = bunsMap[modules[m]] || id; }
	}
	defineBundle.map = function(o) { for (var b in o) { defineBundle(b, o[b]); } };
	defineBundle.map(buns); // make sure we map all of the bundles in the attribute

	function require(oid, parent) {
		var id = resolve(oid, parent && parent.id), uri = resolve(id, path) + ext;
		if (!defs[id]) { throw new Error('Module "' + oid + '" (' + uri + ') was not found.'); }
		if (!modules[id]) {
			var module = (modules[id] = { exports:{}, id:id, uri:uri, loaded:false, parent:parent, children:[] }),
				req = module.require = function(sid) { return require(sid, module); };
			defineProperties(module, { id:READONLY, uri:READONLY, children:READONLY, require:READONLY });

			if (!global.require.main) { // assume first executed module is main
				global.require.main = module;
				defineProperties(global.require, { main:READONLY });
			}

			req.ensure = function(sid, fn) { ensure(sid, id, fn); };
			req.ensure.all = function(sids, fn) { ensureAll(sids, id, fn); };
			req.resolve = function(sid) { return resolve(sid, id); };
			req.main = global.require.main;
			req.cache = modules;
			defineProperties(req, { ensure:READONLY, resolve:READONLY, main:READONLY, cache:READONLY });

			if (parent) { parent.children.push(module); }
			defs[id].call(global, req, module.exports, module);
			module.loaded = true;
			defineProperties(module, { exports:READONLY, loaded:READONLY });
		}
		modules[id].parent = parent;
		return modules[id].exports;
	}

	function resolve(id, base) {
		if (id.slice(-ext.length) === ext) { id = id.slice(0, -ext.length); }
		if (!base) { return id; }
		if (id.charAt(0) === '.') { id = base.replace(/[^\/]+$/, id); }
		var orig = id.split('/'), terms = [], i, l = orig.length;
		for (i = 0; i < l; ++i) {
			if (orig[i] === '..') { terms.pop(); }
			else if (orig[i] !== '.') { terms[terms.length] = orig[i]; }
		}
		return terms.join('/');
	}

	function ensure(id, pid, fn) {
		id = resolve(id, pid);
		if (defs[id]) { return fn(); } // assume all dependencies already loaded

		var head = doc.head || doc.getElementsByTagName('head')[0];
		function script(id, done) {
			var s = doc.createElement('script');
			s.src = path + id + ext;
			s.onload = s.onerror = done;
			s.async = s.defer = true;
			return head.appendChild(s);
		}

		function get(deps, map) {
			var d, dd = deps.length, left = dd;
			function check() { if (--left <= 0) { fn(); } }
			for (d = 0; d < dd; ++d) {
				if (map[deps[d]]) { --left; }
				else { script(deps[d], check); }
			}
			if (left <= 0) { fn(); }
		}

		if (/\.json$/i.test(id)) { return script(id, fn); }

		if (bunsMap[id]) {
			var scripts = doc.getElementsByTagName('script'),
				map = {}, s, ss = scripts.length, bun, m;
			for (s = 0; s < ss; ++s) {
				bun = scripts[s].src.match(/([^\/]+\.bundle)\.js$/);
				if (bun) { map[bun[1]] = 1; }
			}
			for (m in defs) { map[m] = defs[m]; }
			scripts = buns[bunsMap[id]].dependencies || [];
			scripts.unshift(bunsMap[id] + '.bundle');
			return get(scripts, map);
		}

		var xhr = new global.XMLHttpRequest();
		xhr.open('GET', path + id + '/dependencies.json', true);
		xhr.onload = function() { get(JSON.parse(xhr.responseText), defs); };
		xhr.send();
	}

	function ensureAll(ids, pid, fn) {
		var i, ii = ids.length, left = ii;
		function check() { if (--left <= 0) { fn(); } }
		for (i = 0; i < ii; ++i) { ensure(ids[i], pid, check); }
	}

	global.global = global;
	global.define = define;
	global.define.bundle = defineBundle;
	global.require = function(id) { return require(id); };
	global.require.ensure = function(id, fn) { ensure(id, 0, fn); };
	global.require.ensure.all = function(ids, fn) { ensureAll(ids, 0, fn); };
	global.require.resolve = resolve;
	global.require.cache = modules;
	defineProperties(global.require, { ensure:READONLY, resolve:READONLY, cache:READONLY });
	define('require', function(r,e,module) { module.exports = module.parent ? module.parent.require : global.require; });
}(this));
