import counterpart from 'counterpart';

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

export function scoped (scope) {
	return (key, options) => counterpart(key, Object.assign(options || {}, {scope}));
}

export function addChangeListener (fn) {
	counterpart.onLocaleChange(fn);
}

export function removeChangeListener (fn) {
	counterpart.offLocaleChange(fn);
}
