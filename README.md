# FormData

[![npm version][npm-image]][npm-url]

```bash
npm install formdata-polyfill
```

A FormData polyfill<br>
This polyfill conditionally replace the native implementation rather then fixing the missing functions since there is no way to get/delete something that you have appended already. Therefore this also patches `xhr.prototype.send` and `fetch` to instead send the FormData as a blob

I was unable to patch Response/Request constructor so if you are constructing them with a FormData you need to call `fd._blob()` manually.

```js
new Request(url, {
  method: 'post',
  body: fd._blob ? fd.blob() : fd
})
```

Dependencies
---
I do keep the internal data private to prevent unintentional access to them, therefore `WeakMap` is used and you may need a polyfill for that also.

Updating from 2.x to 3.x
---

Previously you had to import the polyfill and use that, since it didn't replace the global (existing) FormData. But now it transparently calls `_blob()` for you when you are sending something with fetch or XHR. This polyfill dose now monkey patch the `send` and `fetch` function.

So you maybe had something like this:

```javascript
var FormData = require('formdata-polyfill')
var fd = new FormData(form)
xhr.send(fd._blob())
```

But that is changed now, there is no module export any longer. So you just have to do like you normal would:

```javascript
var fd = new FormData(form)
xhr.send(fd)
```

The status of the native FormData (2016-10-19) is:
[![skarmavbild 2016-10-19 kl 21 32 19](https://cloud.githubusercontent.com/assets/1148376/19534352/b7f42d8c-9643-11e6-91da-7f89580f51d8.png)](https://developer.mozilla.org/en-US/docs/Web/API/FormData#Browser_compatibility)


This lib provides you all the function others don't include
 - `append` with filename
 - `delete()`, `get()`, `getAll()`, `has()`, `set()`
 - `entries()`, `keys()`, `values()`, and support of `for...of`
 - Available in web workers	(yes, just include it...)


  [npm-image]: https://img.shields.io/npm/v/formdata-polyfill.svg?style=flat-square
  [npm-url]: https://www.npmjs.com/package/formdata-polyfill
