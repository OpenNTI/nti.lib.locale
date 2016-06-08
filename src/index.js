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

export function scoped (scope, fallbacks) {
	return (key, options = {}) => {
		const {fallback = get(key, fallbacks)} = options;
		return counterpart(key, {...options, fallback, scope});
	};
}

export function addChangeListener (fn) {
	counterpart.onLocaleChange(fn);
}

export function removeChangeListener (fn) {
	counterpart.offLocaleChange(fn);
}
