/* global $AppConfig, fetch */
/**
 * Usage:
 * ```js
 * import getString, {scoped} from '@nti/lib-locale';
 *
 * const DEFAULT_TEXT = {
 *  link1: 'hello'
 * };
 *
 * const getStringScoped = scoped('course.contact-info', DEFAULT_TEXT);
 *
 * const link0 = getString('course.contact-info.link0');
 * const link1 = getStringScoped('link1');
 * ```
 * The signature of getString is the same as that of [counterpart]{@link https://www.npmjs.com/package/counterpart}'s translate function.
 * @module @nti/lib-locale
 */
import counterpart from 'counterpart';

const isMissingValue = (str) => /^missing/i.test(str);
const isSimpleObject = o => o && (p => p === null || p === Object.prototype)(Object.getPrototypeOf(o));

function flatten (o, prefix) {
	const out = Object.create(null);
	const getKey = (k) => prefix ? `${prefix}.${k}` : k;

	for (let [key, value] of Object.entries(o)) {
		const k = getKey(key);
		out[k] = value;

		if (isSimpleObject(value)) {
			delete out[k];
			Object.assign(out, flatten(value, k));
		}
	}

	return out;
}

function traverse (path, root, sep = '.') {
	let key, o = root;
	path = path.split(sep).reverse();
	do {
		o = !key ? o : (o[key] || (o[key] = Object.create(null)));
		key = path.pop();
	} while(path.length > 0);
	return [o, key];
}

function gen (path, value) {
	const o = {};
	const [bin, key] = traverse(path, o);
	bin[key] = value;
	return o;
}



/**
 * Get the current locale.
 *
 * @return {string} The locale id
 */
export function getLocale () {
	return (typeof $AppConfig !== 'undefined' && $AppConfig.locale)
		? $AppConfig.locale //Apps served by web-service will have a locale set on the embedded config
		: counterpart.getLocale();
}



/**
 * Inserts & merges locale data for a given locale id.
 *
 * @param  {string} locale The locale id
 * @param  {Object} data   An object with locale strings.
 * @return {void}
 */
export function registerTranslations (locale, data) {
	counterpart.registerTranslations(locale, data);
	counterpart.emit('localechange', locale, locale);
}


/**
 * The default translate function. `getString()` Will return a string given a key.  If the string has interpoation
 * expressions, the options object must have keys that correspond.
 *
 * @function
 * @name translate
 * @param  {string} key                String key-path.
 * @param  {Object} [options]          Optional object with data to be interpolated into the string and a place to store
 *                                     the fallback string.
 * @param  {string} [options.fallback] A fallback string if there is no string for the given key.
 * @return {string}                    the string for the given key
 */
export default function translate (key, options) {
	return counterpart(key, options);
}

translate.isMissing = isMissing;
translate.override = (t2) => override(translate, t2);


/**
 * Given two scoped fns if it doesn't exist in t2, check t1.
 *
 * @param  {Function} t1 the scoped fn to be overridden
 * @param  {Function} t2 the scoped fn to override with
 * @return {Function}    fn to get a string
 */
export function override (t1, t2) {
	const overrideTranslate = (key, options = {}) => {
		const missing1 = t1.isMissing(key);
		const missing2 = t2.isMissing(key);
		let value;

		if (missing1 && missing2) {
			value = `${t1(key, options)}, ${t2(key, options)} `;
		} else if (missing2) {
			value = t1(key, options);
		} else {
			value = t2(key, options);
		}

		return value;
	};

	overrideTranslate.isMissing = (...args) => t1.isMissing(...args) && t2.isMissing(...args);
	overrideTranslate.override = t3 => override(overrideTranslate, t3);

	return overrideTranslate;
}



/**
 * Tests whether the key is present or not. (present is defined as having a value)
 *
 * @param  {string}  key The key to test
 * @return {boolean}     Returns the true if the key is missing.
 */
export function isMissing (key) {
	try {
		return isMissingValue(translate(key, {}));
	} catch (e) {
		//translate only throws when the string contains interpolations, which tells us its not missing.
		return false;
	}
}



/**
 * Return a scoped translate function.
 * @param  {string} scope     The key prefix. Should be a JSON dotted path.
 *
 * eg:
 *   `<package-name|common-name>.path-organization.ComponentName`
 *
 * ex:
 * 	`nti-content.editor.block-types.course-figure.Editor` or `course.contact-info.link0`
 *
 *
 * When we define other languages to fillin the text (instead of the defaults) we will have a large json file with keys:
 * ```js
 * {
 *     "webapp": {...},
 *     "mobile": {...},
 *     "nti-web-commons: { ... },
 *     "nti-content": {
 *         "block-types": {
 *             "course-figure": {
 *                 "Editor": { "figureTitle": "Figure %(index)s", ... }
 *             }
 *         }
 *     }
 * }
 * ```
 * @param  {Object} defaults  An object with default values for keys. The will only be used
 *                            if there is no key in the selected locale.
 * @return {function}         a translate function scoped to the given path. The function also has two inner functions
 * attached to it: `fn.isMissing(key) -> boolean` and `fn.override(withFn) -> fn`
 */
export function scoped (scope, defaults) {
	if (!scope || scope.indexOf('.') < 0) {
		//eslint-disable-next-line no-console
		console.error('"%s" is a bad locale scope ("key" path prefix).', scope);
	}

	const scopedTranslate = (key, options = {}) =>
		counterpart(key, {
			...options,
			scope
		});

	scopedTranslate.isMissing = (key) => isMissing(scope + '.' + key);
	scopedTranslate.override = t2 => override(scopedTranslate, t2);


	if (typeof defaults === 'object') {
		for(let [key, value] of Object.entries(flatten(defaults, scope))) {
			if (isMissing(key)) {
				registerTranslations(getLocale(), gen(key, value));
			}
		}
	}

	return scopedTranslate;
}


/**
 * Adds a callback to be called when languages are added or updated.
 *
 * @param {Function} fn A callback
 * @returns {void}
 */
export function addChangeListener (fn) {
	counterpart.onLocaleChange(fn);
}


/**
 * Removes a callback from the change listeners.
 *
 * @param  {Function} fn A callback
 * @return {void}
 */
export function removeChangeListener (fn) {
	counterpart.offLocaleChange(fn);
}



/**
 * Initializes the locale environment on the client. Applications should call this in their entry point.
 *
 * @return {void}
 */
export function init () {
	const locale = getLocale();

	global.__getLocalData = () => counterpart._registry;

	//This assumes browser context... site/lang specific strings will not work on node (for server side renders) this way.
	fetch(`/site-assets/shared/strings.${locale}.json`)
		.then(res => res.ok
			? res.json()
			: Promise.reject(res.status === 404 ? null : res.statusText)
		)
		.then(translation => registerTranslations(locale, translation))
		.catch(er => er && console.error(er.stack || er.message || er)); //eslint-disable-line
}
