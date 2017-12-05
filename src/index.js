/*global $AppConfig, fetch*/
import counterpart from 'counterpart';

const get = (path, o) => path.split('.').reduce((a, p) => a && a[p], o);

export function getLocale () {
	return (typeof $AppConfig !== 'undefined' && $AppConfig.locale)
		? $AppConfig.locale //Apps served by web-service will have a locale set on the embedded config
		: counterpart.getLocale();
}

export function registerTranslations (locale, data) {
	counterpart.registerTranslations(locale, data);
	counterpart.emit('localechange', locale, locale);
}

export default function translate (...args) {
	return counterpart(...args);
}

function isMissing (str) {
	return /^missing/i.test(str);
}

/**
 * Given two scoped fns if it doesn't exist in t2, check t1.
 * @param  {Function} t1 the scoped fn to be overridden
 * @param  {Function} t2 the scoped fn to override with
 * @return {Function}    fn to get a string
 */
function override (t1, t2) {
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

translate.isMissing = (...args) => isMissing(translate(...args));
translate.override = (...args) => override(...args);



/**
 * Return a scoped translate function.
 * @param  {String} scope     The key prefix. Should be a JSON dotted path.
 *                            eg: `<package-name>.component.organization.ComponentName`
 *                            ex: `nti-content.editor.block-types.course-figure.Editor`
 *
 *                            When we define other languages to fillin the text (instead of the defaults) we will have
 *                            a large json file with keys:
 *                            ```
 *                            {
 *                                "webapp": {...},
 *                                "mobile": {...},
 *                                "nti-web-commons: { ... },
 *                                "nti-content": {
 *                                    "block-types": {
 *                                        "course-figure": {
 *                                            "Editor": { "figureTitle": "Figure %(index)s", ... }
 *                                        }
 *                                    }
 *                                }
 *                            }
 *                            ```
 * @param  {Object} fallbacks An object with default values for keys. The will only be used
 *                            if there is no key in the selected locale.
 * @return {function}           a translate function scoped to the given scope path.
 */
export function scoped (scope, fallbacks) {
	if (!scope || scope.indexOf('.') < 0) {
		//eslint-disable-next-line no-console
		console.error('"%s" is a bad locale scope ("key" path prefix).', scope);
	}

	function scopedTranslate (key, options = {}) {
		return counterpart(key, {
			...options,
			fallback: get(key, fallbacks) || options.fallback,
			scope
		});
	}

	scopedTranslate.isMissing = (...args) => isMissing(scopedTranslate(...args));
	scopedTranslate.override = t2 => override(scopedTranslate, t2);

	return scopedTranslate;
}


export function addChangeListener (fn) {
	counterpart.onLocaleChange(fn);
}

export function removeChangeListener (fn) {
	counterpart.offLocaleChange(fn);
}


export function init () {
	const locale = getLocale();
	//This assumes browser context... site/lang specific strings will not work on node (for server side renders) this way.
	fetch(`/site-assets/shared/strings.${locale}.json`)
		.then(res => res.ok
			? res.json()
			: Promise.reject(res.status === 404 ? null : res.statusText)
		)
		.then(translation => registerTranslations(locale, translation))
		.catch(er => er && console.error(er.stack || er.message || er)); //eslint-disable-line
}
