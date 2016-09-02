const baseConfig = require('nti-unittesting-clientside');
var webpack = require('webpack');

module.exports = function (config) {
	baseConfig.webpack.resolve.root = void 0;
	baseConfig.webpack.plugins = [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': '"test"'
			}
		})
	]

	config.set(Object.assign(baseConfig, {
		files: [
			'test/**/*.js'
		],

		preprocessors: {
			'test/**/*.js': ['webpack', 'sourcemap']
		}
	}));
};
