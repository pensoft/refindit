var search = require('../search');
var isDoi = search.__isDoi;
var isPmc = search.__isPmc;

var assert = require("assert");

describe('Search', function() {
	describe('isDoi', function() {

		it('should parse', function(){
			assert.equal(isDoi('doi:33'), false);
			assert.equal(isDoi('doi:10.'), true);
			assert.equal(isDoi('doi: 10.3897/zookeys.341.6146'), true);
		});
	});

	describe('isPmc', function() {
		it('should parse', function(){
			assert.equal(isPmc('PMC 111111'), true);
			assert.equal(isPmc('PMC11114411'), true);
			assert.equal(isPmc('PMCid: pmc11114411'), true);
			assert.equal(!isPmc('pmc alabala'), true);
		});
	});
});
