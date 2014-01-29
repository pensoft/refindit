var util = require('../dbs/tools');
var assert = require("assert");

describe('Tools', function() {
	describe('parseAuthorString', function() {
		var examples = [
				['M Baehr', ['M', 'Baehr']],
				['L. Peneva',   ['L', 'Peneva']],
				['L., Penevb',  ['L', 'Penevb']],
				['Penevc L.',   ['L', 'Penevc']],
				['Penevd, L.',  ['L', 'Penevd']],
				['Peneve, L',   ['L', 'Peneve']],
				['Penevf ,, L', ['L', 'Penevf']],
				['Lyubomir PenevA', ['Lyubomir', 'PenevA']],
				['PenevB, Lyubomir', ['Lyubomir', 'PenevB']],
				['BERNHARD KROMP', ['BERNHARD', 'KROMP']],
				['J. P. Zaballos', ['J. P.', 'Zaballos']],
				['S.-A. Bengtson', ['S.-A.', 'Bengtson']],
				['Carl H. Lindroth', ['Carl H.', 'Lindroth']],
				['Carmen Chavez Ortiz', ['Carmen Chavez', 'Ortiz']],
				['A.M.H. Brunsting', ['A.M.H.', 'Brunsting']],
				['Artur R. M. Serrano', ['Artur R. M.', 'Serrano']],
			];

			examples.forEach(function(e){
				it('should parse', function(){
					assert.deepEqual(util.parseAuthorString(e[0]), e[1]);
				}
			);
		}
	);
	});
});
