<?php
/**
 * PHP CommonJS boilerplate for in-browser module use
 *  By default, this script assumes all js files in the same directory as it,
 *   as well as all subdirectories are 
 *  Modules::script($name) prints the necessary script tags to make the module available in the web app
 *  Modules::module($name) prints the module code, including all boilerplate code necessary
 *
 *  When the browser directly requests this file,
 *   Modules::module($_SERVER['PATH_INFO']) is output
 *
 *  When this script is called from the command line Modules::module($name) is output
 *   php ./modules.php [name] [config_file]; # both arguments are optional, config_file nust have a .config.json extension
 *
 * Copyright 2012, Andy VanWagoner
 * Released under the MIT License.
 **/
class Modules {
	/**
	 * Gets the default options used when you don't specify an option.
	 *  Defaults are loaded from the Modules.config.json file
	 **/
	public static function & getDefaultOptions() {
		if (!isset(self::$default_opts)) {
			self::$default_opts = array(
				'mod_dir'  => str_replace('\\', '/', dirname(__FILE__)),
				'return'   => false,
				'src_url'  => str_replace('\\', '/', str_replace(realpath($_SERVER['DOCUMENT_ROOT']), '', realpath(__FILE__))),
				'separate' => false,
				'indent'   => '	',
				'headers'  => array( 'Content-Type'=>true, 'Expires'=>'+30 days', 'Last-Modified'=>true ),
				'compress' => false,
				'require'  => dirname(__FILE__).'/require.js'
			);
			self::loadDefaultOptions(dirname(__FILE__).'/modules.config.json');
		}
		return self::$default_opts;
	}

	/**
	 * Sets the default options used when you don't specify an option.
	 **/
	public static function setDefaultOptions(array $opts) {
		$default_opts =& self::getDefaultOptions();
		foreach ($opts as $key => &$value) {
			if (array_key_exists($key, $default_opts)) $default_opts[$key] = $value;
		}
	}
	
	/**
	 * Loads default options from a config file
	 **/
	public static function loadDefaultOptions($file) {
		$json = file_get_contents($file);
		$json = preg_replace('/^\/\/.*?$/m', '', $json); // strip comments
		$json = preg_replace('/,\s*}/', '}', $json); // don't let trailing commas bother
		if ($json = json_decode($json, true)) self::setDefaultOptions($json);
	}

	protected static $default_opts;
	protected static function & getOptions(array &$opts=null) {
		$default_opts =& self::getDefaultOptions();
		return array(
			'mod_dir'  => empty($opts['mod_dir'])   ? $default_opts['mod_dir']  : $opts['mod_dir'],
			'return'   => !isset($opts['return'])   ? $default_opts['return']   : $opts['return'],
			'src_url'  => empty($opts['src_url'])   ? $default_opts['src_url']  : $opts['src_url'],
			'separate' => !isset($opts['separate']) ? $default_opts['separate'] : $opts['separate'],
			'indent'   => !isset($opts['indent'])   ? $default_opts['indent']   : $opts['indent'],
			'headers'  => !isset($opts['headers'])  ? $default_opts['headers']  : $opts['headers'],
			'compress' => !isset($opts['compress']) ? $default_opts['compress'] : $opts['compress'],
			'require'  => empty($opts['require'])   ? $default_opts['require']  : $opts['require']
		);
	}


	/**
	 * Prints the script tags required to use CommonJS modules in the browser
	 * @param $name name of the module - must be a Modules 1.1.1 top-level module identifier
	 *  if name is falsy, tags for all modules in the root modules folder are output
	 *  if name resolves to a folder, tags for all modules in that folder are output
	 * @param array $opts options influencing how the modules are found, and how the tags are printed
	 *  indent - a whitespace string to print before each script tag
	 *  src_url - the url where browser retrieves the modules
	 *  separate - if true, each module will be in it's own script tag, defaults to false
	 *  return - if true returns the output as a string, instead of printing it
	 **/
	public static function script($name=null, array $opts=null) {
		$opts =& self::getOptions($opts);
		$ind = $opts['indent'];
		$src = $opts['src_url'];
		if ($opts['separate']) {
			$modules =& self::getModules($name, $opts);
			foreach ($modules as $name => &$filename) {
				$out .= $ind.'<script src="'.$src.'/'.$name.'"></script>'."\n";
			}
		} else {
			$out = $ind.'<script src="'.$src.(empty($name)?'':'/'.$name).'"></script>'."\n";
		}
		if ($opts['return']) return $out;
		else echo $out;
	}

	/**
	 * Prints the code for the module(s), including boilerplate code necessary in the browser.
	 * @param $name name of the module - must be a Modules 1.1.1 top-level module identifier
	 *  if name is falsy, all modules in the root modules folder are output
	 *  if name resolves to a folder, all modules in that folder are output
	 * @param array $opts options influencing how the module name is resolved, and how the code is printed
	 *  mod_dir - specifies the root modules folder (no trailing slash)
	 *  compress - specifies a function to compress the javascript code, or false to not compress
	 *   the function specified must take the uncompressed code as the first parameter, and return the compressed code
	 *  headers - The headers sent (only if return is false)
	 *  return - if true the code is returned from the funtion, not printed
	 **/
	public static function module($name=null, array $opts=null) {
		$opts =& self::getOptions($opts);
		$modules =& self::getModules($name, $opts);

		$out = ''; $last = 0;
		if (!$name && $opts['require']) { // define require if all modules
			$out .= self::printRequire($opts);
			$last = filemtime($opts['require']);
		}
		foreach ($modules as $name => &$filename) {
			$out .= self::printModule($name, $filename, $opts);
			$last = max($last, filemtime($filename));
		}

		$compress =& $opts['compress'];
		if (!empty($compress['function'])) {
			if (!empty($compress['include'])) @include_once $compress['include'];
			$compressed = call_user_func($compress['function'], $out);
			if ($compressed) $out = $compressed;
		}

		$headers =& $opts['headers'];
		if (!$opts['return'] && !empty($headers) && is_array($headers)) {
			if (!empty($headers['Content-Type']))
				header('Content-Type: '.(is_string($headers['Content-Type']) ? $headers['Content-Type'] : 'text/javascript'));
			if (!empty($headers['Last-Modified']))
				header('Last-Modified: '.gmdate('D, d M Y H:i:s', $last).' GMT');
			if (!empty($headers['Expires']))
				header('Expires: '.gmdate('D, d M Y H:i:s', strtotime($headers['Expires'])).' GMT');
		}

		if ($opts['return']) return $out;
		else echo $out;
	}

	protected static function & getModules($name, array &$opts) {
		$modules = array();
		$mod_dir = $opts['mod_dir'];
		$prefix = strlen($mod_dir)+1;
		$files = array();
		if ($name) {
			if (!preg_match('/^\w+(?:\/\w+)*$/', $name)) throw new Exception('"'.$name.'" is not a valid Modules 1.1.1 top-level module identifier', 1);
			$filename = $mod_dir.'/'.$name.'.js';
			if (!is_file($filename) || !is_readable($filename)) {
				$filename = $opts['mod_dir'].'/'.$name; // not a module, try a folder
				if (!is_dir($filename) || !is_readable($filename)) throw new Exception('Module "'.$name.'" could not resolve to a readable file', 2);
			}
			$files[] = $filename;
		} else { // include all modules
			$files[] = $mod_dir;
		}
		$visited = array();
		while (!empty($files)) {
			$file = array_pop($files);

			// prevent infinite looping from circular links
			$real = realpath($file);
			if ($visited[$real]) continue;
			$visited[$real] = true;

			// depth-first traveral of directories
			if (is_dir($file)) {
				if (!($dir = opendir($file))) continue;
				while (($sub = readdir($dir)) !== false) {
					if ($sub{0} === '.') continue;
					$subf = $file.'/'.$sub;
					if ((preg_match('/^\w+\.js$/i', $sub) || is_dir($subf)) && is_readable($subf)) $files[] = $subf;
				}
				closedir($dir);
				continue;
			}

			// convert filename to name
			$name = substr($file, $prefix, -3); // remove mod_dir prefix and .js suffix
			if ('/index' === substr($name, -6)) $name = substr($name, 0, -6);
			$modules[$name] = $file;
		}
		return $modules;
	}

	protected static function printModule($name, $filename, array &$opts) {
		if ('require' === $name) return self::printRequire($opts);
		return 'define('.json_encode($name).',function(require,exports,module){'.
				file_get_contents($filename).
			"\n});\n";
	}

	protected static function printRequire(array &$opts) {
		return file_get_contents($opts['require']);
	}
}


// command line use
if (!empty($argv) && realpath(__FILE__) === realpath($argv[0])) {
	$name = $argv[1];
	$config = $argv[2];
	if (substr($name, -12) === '.config.json') {
		$config = $name;
		$name = null;
	}
	if ($config) Modules::loadDefaultOptions($config);
	Modules::module($name, array( 'return'=>false ));
}


// direct request use
if (empty($argv) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
	$name = empty($_SERVER['PATH_INFO']) ? null : trim($_SERVER['PATH_INFO'], " \t\r\n\0\x0B\\/");
	Modules::module($name, array( 'return'=>false ));
}
