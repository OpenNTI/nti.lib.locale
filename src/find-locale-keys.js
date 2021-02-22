const BLACK_LIST = {
	counterpart: true,
};

function matches(value, predicate) {
	if (Array.isArray(predicate)) {
		return predicate.some(p => matches(value, p));
	}

	if (typeof predicate === 'function') {
		return predicate(value);
	}

	if (typeof predicate === 'string') {
		return value.toLowerCase().indexOf(predicate.toLowerCase()) >= 0;
	}

	if (predicate.test) {
		return predicate.test(value);
	}

	return false;
}

function filter(obj, predicate) {
	const keys = Object.keys(obj);
	const filtered = {};

	for (let key of keys) {
		let value = obj[key];

		if (BLACK_LIST[key]) {
			continue;
		}

		if (typeof value !== 'string') {
			value = filter(value, predicate);
			if (value) {
				filtered[key] = value;
			}
		} else if (matches(value, predicate)) {
			filtered[key] = value;
		}
	}

	return Object.keys(filtered).length === 0 ? null : filtered;
}

export default function findLocaleKeys(registry, predicate) {
	return filter(registry, predicate);
}
