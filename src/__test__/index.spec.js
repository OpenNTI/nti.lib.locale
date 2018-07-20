/* eslint-env jest */
import translate, {
	addChangeListener,
	removeChangeListener,
	registerTranslations,
	scoped,
	getLocale,
	getLocalizedCurrencyString
} from '../index';


describe ('Locale Tests', ()=> {

	const locale = getLocale();

	describe ('Values from web-service', () => {
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

		test ('uses directed locale from web-service', () => {
			global.$AppConfig.locale = 'ru';
			expect(getLocale()).toBe('ru');
		});
	});

	test ('fires locale change event', (done) => {

		function onChange () {
			removeChangeListener(onChange);
			expect(translate('foo')).toBe('bar');
			done();
		}

		addChangeListener(onChange);
		registerTranslations(locale, {'foo': 'bar'});
	});


	test ('scoped', () => {
		registerTranslations(locale, {'nti-lib-locale': {test: {scope: { 'foo': 'baz'}}}});
		const t = scoped('nti-lib-locale.test.scope');
		expect(t('foo')).toBe('baz');
		expect(translate('foo')).toBe('bar');
	});

	test ('scoped with fallback', () => {
		const t = scoped('nti-lib-locale.test.scope', {baz: {foodoo: 'bar'}});
		expect(t('baz.foodoo')).toBe('bar');
	});

	test ('defining fallbacks does not override local options', () => {
		const t = scoped('nti-lib-locale.test.scope', {baz: {foodoo: 'bar'}});

		expect(t('baz.foodoo',{fallback: 'dude!'})).toBe('bar');
		expect(t('baz.foodoo2',{fallback: 'dude!'})).toBe('dude!');
	});

	test ('fallbacks does not introduce exceptions', () => {
		const t = scoped('nti-lib-locale.test.scope', {baz: {foodoo: 'bar'}});
		expect(()=> t('does.not.exist')).not.toThrow();
	});

	test ('normal placeholder text still returns', () => {
		const t = scoped('nti-lib-locale.test.scope', {baz: {foodoo: 'bar'}});
		expect(t('does.not.exist')).toEqual('missing translation: en.nti-lib-locale.test.scope.does.not.exist');
	});

	describe ('Overriding Tests', () => {
		let t, base, override;
		const baseOnly = 'base only';
		const overrideOnly = 'override only';
		const topLevel = 'top level';
		const nested = 'nested value';


		beforeEach(() => {
			base = scoped('nti-lib-locale.tests.override.base.scope', {
				baseOnly: baseOnly,
				topLevel: `${topLevel} base`,
				nested: {
					value: `${nested} base`
				}
			});

			override = scoped('nti-lib-locale.tests.override.override.scope', {
				overrideOnly: overrideOnly,
				topLevel: topLevel,
				nested: {
					value: nested
				}
			});

			t = base.override(override);
		});


		test ('Gets string only in base', () => {
			const s = t('baseOnly');

			expect(s).toEqual(baseOnly);
		});

		test ('Gets string only in override', () => {
			const s = t('overrideOnly');

			expect(s).toEqual(overrideOnly);
		});

		test ('Gets top level string from override that is in both', () => {
			const s = t('topLevel');

			expect(s).toEqual(topLevel);
		});

		test ('Gets nested string from override that is in both', () => {
			const s = t('nested.value');

			expect(s).toEqual(nested);
		});

		describe ('Overrides are chainable', () => {
			let chained, third;
			const thirdOnly = 'thirdLevelOnly';
			const topLevelThird = 'top level third';
			const nestedThird = 'nested third value';

			beforeEach(() => {
				third = scoped('nti-lib-locale.tests.override.third.scope', {
					thirdOnly: thirdOnly,
					topLevel: topLevelThird,
					nested: {
						value: nestedThird
					}
				});

				chained = t.override(third);
			});

			test ('Gets string only in base', () => {
				const s = chained('baseOnly');

				expect(s).toEqual(baseOnly);
			});

			test ('Gets string only in override', () => {
				const s = chained('overrideOnly');

				expect(s).toEqual(overrideOnly);
			});

			test ('Gets string only in third', () => {
				const s = chained('thirdOnly');

				expect(s).toEqual(thirdOnly);
			});

			test ('Gets top level string from chained that is in all three', () => {
				const s = chained('topLevel');

				expect(s).toEqual(topLevelThird);
			});

			test ('Gets nested string from chained that is in all three', () => {
				const s = chained('nested.value');

				expect(s).toEqual(nestedThird);
			});
		});
	});

	test ('currency localizer', () => {
		expect(getLocalizedCurrencyString()).toBe(null);
		expect(getLocalizedCurrencyString(555)).toBe('555');
		expect(getLocalizedCurrencyString(123, 'USD')).not.toBe(null);
		expect(getLocalizedCurrencyString(123, 'USD', 'en-us')).toEqual('$123');
		expect(getLocalizedCurrencyString(1234, 'GBP', 'de-DE')).toEqual('£ 1,234');
	});
});
