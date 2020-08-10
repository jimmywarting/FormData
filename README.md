# FormData

[![Greenkeeper badge](https://badges.greenkeeper.io/jimmywarting/FormData.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/jimmywarting/FormData.svg?branch=master)](https://travis-ci.org/jimmywarting/FormData)

[![npm version][npm-image]][npm-url]

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

```bash
npm install formdata-polyfill
```

A `FormData` polyfill

This polyfill conditionally replaces the native implementation rather then fixing the missing functions,
since otherwise there is no way to get or delete existing values in the FormData object.
Therefore this also patches `XMLHttpRequest.prototype.send` and `fetch` to send the `FormData` as a blob,
and `navigator.sendBeacon` to send native `FormData`.

I was unable to patch the Response/Request constructor
so if you are constructing them with FormData you need to call `fd._blob()` manually.

```js
new Request(url, {
  method: 'post',
  body: fd._blob ? fd._blob() : fd
})
```

Part of this polyfill is loaded asynchronously. If you plan on making `fetch`
calls right after the page has loaded, there is a promise that's exposed that
you should await:

```js
await (Request.polyfillPromise || Promise.resolve())
// OR
(Request.polyfillPromise || Promise.resolve()).then(/* your code here /*)
```

Make sure the polyfill is loaded before you await the promise. The promise will
only be missing if the polyfill cannot be loaded, which only happens on very
old browsers.

Dependencies
---

If you need to support IE <= 9 then I recommend you to include eligrey's [blob.js]

<details>
    <summary>Updating from 2.x to 3.x</summary>

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

</details>



Native Browser compatibility (as of 2020-01-13)
---
Based on this you can decide for yourself if you need this polyfill. 

[![skarmavbild 2020-01-13 kl 20 16 36](https://user-images.githubusercontent.com/1148376/72220782-80a45600-3554-11ea-8107-06025f3a3f8a.png)](https://developer.mozilla.org/en-US/docs/Web/API/FormData#Browser_compatibility)



This polyfill normalizes support for the FormData API:

 - `append` with filename
 - `delete()`, `get()`, `getAll()`, `has()`, `set()`
 - `entries()`, `keys()`, `values()`, and support for `for...of`
 - Available in web workers (just include the polyfill)

  [npm-image]: https://img.shields.io/npm/v/formdata-polyfill.svg
  [npm-url]: https://www.npmjs.com/package/formdata-polyfill
  [blob.js]: https://github.com/eligrey/Blob.js
