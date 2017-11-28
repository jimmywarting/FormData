# FormData

[![Greenkeeper badge](https://badges.greenkeeper.io/jimmywarting/FormData.svg)](https://greenkeeper.io/)

[![npm version][npm-image]][npm-url]

```bash
npm install formdata-polyfill
```

A `FormData` polyfill

This polyfill conditionally replaces the native implementation rather then fixing the missing functions,
since otherwise there is no way to get or delete existing values in the FormData object.
Therefore this also patches `XMLHttpRequest.prototype.send` and `fetch` to send the FormData as a blob.

I was unable to patch the Response/Request constructor
so if you are constructing them with FormData you need to call `fd._blob()` manually.

```js
new Request(url, {
  method: 'post',
  body: fd._blob ? fd.blob() : fd
})
```

Dependencies
---

The internal data is kept private to prevent unintentional access to it,
therefore `WeakMap` is used and you may also need a polyfill for that.

Updating from 2.x to 3.x
---

Previously you had to import the polyfill and use that,
since it didn't replace the global (existing) FormData implementation.
But now it transparently calls `_blob()` for you when you are sending something with fetch or XHR,
by way of monkey-patching the `XMLHttpRequest.prototype.send` and `fetch` functions.

So you maybe had something like this:

```javascript
var FormData = require('formdata-polyfill')
var fd = new FormData(form)
xhr.send(fd._blob())
```

There is no longer anything exported from the module
(though you of course still need to import it to install the polyfill),
so you can now use the FormData object as normal:

```javascript
require('formdata-polyfill')
var fd = new FormData(form)
xhr.send(fd)
```

The status of the native FormData (2016-10-19) is:
[![skarmavbild 2016-10-19 kl 21 32 19](https://cloud.githubusercontent.com/assets/1148376/19534352/b7f42d8c-9643-11e6-91da-7f89580f51d8.png)](https://developer.mozilla.org/en-US/docs/Web/API/FormData#Browser_compatibility)

This polyfill normalizes support for the FormData API:

 - `append` with filename
 - `delete()`, `get()`, `getAll()`, `has()`, `set()`
 - `entries()`, `keys()`, `values()`, and support for `for...of`
 - Available in web workers (just include the polyfill)

  [npm-image]: https://img.shields.io/npm/v/formdata-polyfill.svg?style=flat-square
  [npm-url]: https://www.npmjs.com/package/formdata-polyfill
