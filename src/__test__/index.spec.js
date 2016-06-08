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

	it ('scoped with fallback', () => {
		const t = scoped('scope', {baz: {foodoo: 'bar'}});
		expect(t('baz.foodoo')).toBe('bar');
	});

	it ('defining fallbacks does not override local options', () => {
		const t = scoped('scope', {baz: {foodoo: 'bar'}});
		expect(t('baz.foodoo',{fallback: 'dude!'})).toBe('dude!');
	});

	it ('fallbacks does not introduce exceptions', () => {
		const t = scoped('scope', {baz: {foodoo: 'bar'}});
		expect(()=> t('does.not.exist')).not.toThrow();
	});

	it ('normal placeholder text still returns', () => {
		const t = scoped('scope', {baz: {foodoo: 'bar'}});
		expect(t('does.not.exist')).toEqual('missing translation: en.scope.does.not.exist');
	});
});
