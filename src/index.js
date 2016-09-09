import counterpart from 'counterpart';

const get = (path, o) => path.split('.').reduce((a, p) => a && a[p], o);

export function getLocale () {
	return counterpart.getLocale();
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
	return (key, options = {}) => {
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
}

translate.isMissing = (...args) => isMissing(translate(...args));
translate.override = (...args) => override(...args);

export function scoped (scope, fallbacks) {
	function scopedTranslate (key, options = {}) {
		const {fallback = get(key, fallbacks)} = options;
		return counterpart(key, {...options, fallback, scope});
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
