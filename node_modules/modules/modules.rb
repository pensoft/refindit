# The worst Ruby translation of Andy's modules.php script ever.
# I'll be completely shocked if this works at all, but a few lines here and there might be correct. Hooray!

class Modules
	
	def self.getDefaultOptions
		if @@default_opts == nil
			@@default_opts = {
				'mod_dir'  => dirname(__FILE__).sub('\\', '/'),
				'return'   => false,
				'src_url'  => realpath(__FILE__).sub(realpath($_SERVER['DOCUMENT_ROOT']), '').sub('\\', '/'),
				'separate' => false,
				'indent'   => '	',
				'headers'  => {'Content-Type' => true, 'Expires' => '+30 days', 'Last-Modified' => true},
				'compress' => false,
				'require'  => dirname(__FILE__).'modules.require.js',
			}
			self.loadDefaultOptions(dirname(__FILE__).'modules.config.js')
		end
		return @@default_opts
	end
	
	def self.setDefaultOptions(opts)
		@@default_opts = self.getDefaultOptions
		opts.each { |key, value| 
			if @@default_opts[key] != nil
				@@default_opts[key] = value
			end
		}
	end
	
	def self.loadDefaultOptions(file)
		json = file_get_contents(file)
		json.sub!('/^\/\/.*?$/m', '')
		json.sub!('/,\s*}/', '}',)
		self.setDefaultOptions(json) if json = json_decode(json, true)
	end
	
	@@default_variables = nil
	def self.getOptions(opts = nil)
		@@default_opts = self.getDefaultOptions
		return {
			'mod_dir'  => if opts['mod_dir'] == nil  ? @@default_opts['mod_dir']  : opts['mod_dir'],
			'return'   => if opts['return'] == nil   ? @@default_opts['return']   : opts['return'],
			'src_url'  => if opts['src_url'] == nil  ? @@default_opts['src_url']  : opts['src_url'],
			'separate' => if opts['separate'] == nil ? @@default_opts['separate'] : opts['separate'],
			'indent'   => if opts['indent'] == nil   ? @@default_opts['indent']   : opts['indent'],
			'headers'  => if opts['headers'] == nil  ? @@default_opts['headers']  : opts['headers'],
			'compress' => if opts['compress'] == nil ? @@default_opts['compress'] : opts['compress'],
			'require'  => if opts['require'] == nil  ? @@default_opts['require']  : opts['require'],
		}
	end
	
	
	
	def self.script(name = nil, opts = nil)
		opts = self.getOptions(opts)
		ind = opts['indent']
		src = opts['src_url']
		if opts['separate']
			modules = self.getModules(name, opts)
			modules.each { |name, filename| 
				out = ind + '<script src="' + src + '/' + name + '"></script>' + "\n"
			}
		else
			out = ind + '<script src="' + src + ($name == nil ? '' : '/' + $name) + '"></script>' + "\n"
		end
		if opts['return'] ? return out : print out
	end
	
	def self.module(name = nil, opts = nil)
		opts = self.getOptions(opts)
		modules = self.getModules(name, opts)
		
		out = ''
		last = 0
		if name == false and opts['require'] == true   # not 100% sure whether we're checking if name == false or name == nil
			out = self.printRequire(opts)
			last = opts['require'].mtime
		end
		modules.each { |name, filename|
			out = self.printRequire(name, filename, opts)
			last = [last, filename.mtime].max
		}
		
		compress = opts['compress']
		if compress['function'] != nil
			if compress['include'] != nil
				self.include(compress['include']) unless self.include?(compress['include'])
			end
			compressed = call_user_func(compress['function'], out)
			out = compressed if compressed
		end
		
		headers = opts['headers']
		if opts['return'] && headers != nil && headers.is_a?(Array)
			if headers['Content-Type'] != nil
				header('Content-Type: ' + headers['Content-Type'].is_a?(String) ? headers['Content-Type'] : 'text/javascript'))
			end
			if headers['Last-Modified'] != nil
				header('Last-Modified: ' + Time.gm(last.year, last.mon, last.day, last.hour, last.min, last.sec).to_s + ' GMT')
			end
			if headers['Expires'] != nil
				header('Expires: ' + Time.new + ' GMT')   # Not sure how to turn a string into a time...
			end
		end
		
		if opts['return'] ? return out : print out
	end
	
	def self.getModules(name, opts)
		modules = {}
		mod_dir = opts['mod_dir']
		prefix = mod_dir.length + 1
		files = []
		if name != nil
			# preg match, throw new exception
			filename = mod_dir + '/' + name + '.js'
			if File.exist?(filename) == false || File.readable?(filename) == false
				filename = opts['mod_dir'] + '/' + name
				if Dir.exist?(filename) == false || Dir.readable?(filename) == false
					# throw new exception
				end
			end
			files.push(filename)
		else
			files.push(mod_dir)
		end
		visited = {}
		while files.empty? == false
			file = files.pop
			
			real = realpath(file)
			next if visited[real] == true
			visited[real] = true
			
			if file.is_a?(Dir)
				next if dir != Dir.open(file)
				while sub = dir.read(file) !== false
					next if sub{0} === '.'
					subf = file + '.' + sub
					# preg match
				end
				dir.close
				next
			end
			
			name = file[prefix..file.length - 3]
			modules[name] = file
		end
		return modules
	end
	
	def self.printModule(name, filename, opts)
		return "/* ==MODULE== $name */" +
			"require.define('$name',function(module,exports){\n" +
				file_get_contents($filename) +
			"\n/* ==ENDMODULE== $name */});\n"
	end
	
	def self.printRequire(opts)
		return file_get_contents(opts['require'])   # not sure if there's a way to turn a file's contents into a string in Ruby...?
	end
	
end

if argv.empty? == false && realpath(__FILE__) === realpath(argv[0])
	name = argv[1]
	config = argv[2]
	if name[name.length - 12..name.length] == 'config.json'
		config = name
		name = nil
	end
	Modules.loadDefaultOptions(config) if config != nil
	Modules.module(name, {'return' => false})
end

if argv.empty? == false && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])
	name = $_SERVER['PATH_INFO'] == nil ? nil : $_SERVER['PATH_INFO'].tr("\t\r\n\0\x0B\\/", '')
	Modules.module(name, {'return' => false})
end