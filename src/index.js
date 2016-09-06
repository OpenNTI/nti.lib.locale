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

translate.isMissing = (...args) => isMissing(translate(...args));

export function scoped (scope, fallbacks) {
	function scopedTranslate (key, options = {}) {
		const {fallback = get(key, fallbacks)} = options;
		return counterpart(key, {...options, fallback, scope});
	}

	scopedTranslate.isMissing = (...args) => isMissing(scopedTranslate(...args));

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

//Ug... magical init on import is kind of bad. The client of this module should call init directly.
if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined') {
	setTimeout(init, 1);//separate frame
}
