import translate, {
	addChangeListener,
	removeChangeListener,
	registerTranslations,
	scoped,
	getLocale
} from '../index';


describe('Locale Tests', ()=> {

	const locale = getLocale();

	describe('Values from web-service', () => {
		let oldAppConfig;
		beforeEach(() => {
			oldAppConfig = global.$AppConfig;
			global.$AppConfig = {...(oldAppConfig || {})};
		});

		afterEach(() => {
			global.$AppConfig = oldAppConfig;
			if (global.$AppConfig == null) {
				delete global.$AppConfig;
			}
		});

		it('uses directed locale from web-service', () => {
			global.$AppConfig.locale = 'ru';
			expect(getLocale()).toBe('ru');
		});
	});

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

	describe('Overriding Tests', () => {
		let t, base, override;
		const baseOnly = 'base only';
		const overrideOnly = 'override only';
		const topLevel = 'top level';
		const nested = 'nested value';


		beforeEach(() => {
			base = scoped('override-test-base-scope', {
				baseOnly: baseOnly,
				topLevel: `${topLevel} base`,
				nested: {
					value: `${nested} base`
				}
			});

			override = scoped('override-test-override-scope', {
				overrideOnly: overrideOnly,
				topLevel: topLevel,
				nested: {
					value: nested
				}
			});

			t = base.override(override);
		});


		it('Gets string only in base', () => {
			const s = t('baseOnly');

			expect(s).toEqual(baseOnly);
		});

		it('Gets string only in override', () => {
			const s = t('overrideOnly');

			expect(s).toEqual(overrideOnly);
		});

		it('Gets top level string from override that is in both', () => {
			const s = t('topLevel');

			expect(s).toEqual(topLevel);
		});

		it('Gets nested string from override that is in both', () => {
			const s = t('nested.value');

			expect(s).toEqual(nested);
		});

		describe('Overrides are chainable', () => {
			let chained, third;
			const thirdOnly = 'thirdLevelOnly';
			const topLevelThird = 'top level third';
			const nestedThird = 'nested third value';

			beforeEach(() => {
				third = scoped('override-test-third-scope', {
					thirdOnly: thirdOnly,
					topLevel: topLevelThird,
					nested: {
						value: nestedThird
					}
				});

				chained = t.override(third);
			});

			it('Gets string only in base', () => {
				const s = chained('baseOnly');

				expect(s).toEqual(baseOnly);
			});

			it('Gets string only in override', () => {
				const s = chained('overrideOnly');

				expect(s).toEqual(overrideOnly);
			});

			it('Gets string only in third', () => {
				const s = chained('thirdOnly');

				expect(s).toEqual(thirdOnly);
			});

			it('Gets top level string from chained that is in all three', () => {
				const s = chained('topLevel');

				expect(s).toEqual(topLevelThird);
			});

			it('Gets nested string from chained that is in all three', () => {
				const s = chained('nested.value');

				expect(s).toEqual(nestedThird);
			});
		});
	});
});
