var util = require('../dbs/tools');
var assert = require("assert");

describe('Tools', function() {
	describe('parseAuthorString', function() {
		var examples = [
				 ['L., Penevb',  ['L.', 'Penevb']],
				 ['M Baehr', ['M', 'Baehr']],
				 ['L. Peneva',   ['L.', 'Peneva']],
				 ['Lyubomir PenevA', ['Lyubomir', 'PenevA']],
				 ['BERNHARD KROMP', ['BERNHARD', 'KROMP']],
				 ['J. P. Zaballos', ['J. P.', 'Zaballos']],
				 ['S.-A. Bengtson', ['S.-A.', 'Bengtson']],
				 ['Carl H. Lindroth', ['Carl H.', 'Lindroth']],
				 ['Carmen Chavez Ortiz', ['Carmen Chavez', 'Ortiz']],
				 ['A.M.H. Brunsting', ['A.M.H.', 'Brunsting']],
				 ['Artur R. M. Serrano', ['Artur R. M.', 'Serrano']],

				 ['Vázquez L.',  ['L.', 'Vázquez']],
				 ['Smith-Ramírez, L.',  ['L.', 'Smith-Ramírez']],
				 ['Peneve, L',   ['L', 'Peneve']],
				 ['Penevf ,, L', ['L', 'Penevf']],
				 ['PenevB, Lyubomir', ['Lyubomir', 'PenevB']],
				 ['Öckinger,Erik', ['Erik', 'Öckinger']],
				 ['Vázquez, D. P.', ['D. P.', 'Vázquez']],
				 ['Andersson, Georg K. S.', ['Georg K. S.', 'Andersson']],
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
