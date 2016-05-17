import translate, {
	addChangeListener,
	removeChangeListener,
	registerTranslations,
	scoped,
	getLocale
} from '../index';


describe('Locale Tests', ()=> {

	const locale = getLocale();

	it('fires locale change event', (done) => {

		function onChange () {
			removeChangeListener(onChange);
			expect(translate('foo')).toBe('bar');
			done();
		}

		addChangeListener(onChange);
		registerTranslations(locale, {'foo': 'bar'});
	});


	it ('scoped', () => {
		registerTranslations(locale, {'scope': { 'foo': 'baz'}});
		const t = scoped('scope');
		expect(t('foo')).toBe('baz');
		expect(translate('foo')).toBe('bar');
	});
});
