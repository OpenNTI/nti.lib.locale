nti-lib-locale
==============

Usage:
```js
import getString, {scoped} from 'nti-lib-locale';

const DEFAULT_TEXT = {
 link1: 'hello'
};

const getStringScoped = scoped('course.contact-info', DEFAULT_TEXT);

const link0 = getString('course.contact-info.link0');
const link1 = getStringScoped('link1');
```
The signature of getString is the same as that of [counterpart](https://www.npmjs.com/package/counterpart)'s translate function.
