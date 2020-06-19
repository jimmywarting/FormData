/* global FormData self Blob File */
/* eslint-disable no-inner-declarations */

const global = typeof globalThis === 'object'
  ? globalThis
  : typeof window === 'object'
    ? window
    : typeof self === 'object' ? self : this

// keep a reference to native implementation
const _FormData = global.FormData
const _Request = global.Request
const _Response = global.Response

const isPolyfillPossible = typeof Blob !== 'undefined'
if (isPolyfillPossible) {
  // cannot polyfill without Blob
  loadFormDataPolyfill()
  loadRequestResponsePolyfill()
}

function loadFormDataPolyfill (action) {
  const isFormDataPolyfillNeeded =
    typeof FormData === 'undefined' || !FormData.prototype.keys
  if (!isFormDataPolyfillNeeded) {
    return
  }

  // To be monkey patched
  const _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send
  const _fetch = global.Request && global.fetch
  const _sendBeacon = global.navigator && global.navigator.sendBeacon
  // Might be a worker thread...
  const _match = global.Element && global.Element.prototype

  // Unable to patch Request/Response constructor correctly #109
  // only way is to use ES6 class extend
  // https://github.com/babel/babel/issues/1966

  const stringTag = global.Symbol && Symbol.toStringTag

  // Add missing stringTags to blob and files
  if (stringTag) {
    if (!Blob.prototype[stringTag]) {
      Blob.prototype[stringTag] = 'Blob'
    }

    if ('File' in global && !File.prototype[stringTag]) {
      File.prototype[stringTag] = 'File'
    }
  }

  // Fix so you can construct your own File
  try {
    new File([], '') // eslint-disable-line
  } catch (a) {
    global.File = function File (b, d, c) {
      const blob = new Blob(b, c)
      const t = c && void 0 !== c.lastModified ? new Date(c.lastModified) : new Date()

      Object.defineProperties(blob, {
        name: {
          value: d
        },
        lastModifiedDate: {
          value: t
        },
        lastModified: {
          value: +t
        },
        toString: {
          value () {
            return '[object File]'
          }
        }
      })

      if (stringTag) {
        Object.defineProperty(blob, stringTag, {
          value: 'File'
        })
      }

      return blob
    }
  }

  function normalizeValue ([name, value, filename]) {
    if (value instanceof Blob) {
      // Should always returns a new File instance
      // console.assert(fd.get(x) !== fd.get(x))
      value = new File([value], filename, {
        type: value.type,
        lastModified: value.lastModified
      })
    }

    return [name, value]
  }

  function ensureArgs (args, expected) {
    if (args.length < expected) {
      throw new TypeError(`${expected} argument required, but only ${args.length} present.`)
    }
  }

  function normalizeArgs (name, value, filename) {
    return value instanceof Blob
      // normalize name and filename if adding an attachment
      ? [String(name), value, filename !== undefined
        ? filename + '' // Cast filename to string if 3th arg isn't undefined
        : typeof value.name === 'string' // if name prop exist
          ? value.name // Use File.name
          : 'blob'] // otherwise fallback to Blob

      // If no attachment, just cast the args to strings
      : [String(name), String(value)]
  }

  // normalize linefeeds for textareas
  // https://html.spec.whatwg.org/multipage/form-elements.html#textarea-line-break-normalisation-transformation
  function normalizeLinefeeds (value) {
    return value.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n')
  }

  function each (arr, cb) {
    for (let i = 0; i < arr.length; i++) {
      cb(arr[i])
    }
  }

  /**
   * @implements {Iterable}
   */
  class FormDataPolyfill {
    /**
     * FormData class
     *
     * @param {HTMLElement=} form
     */
    constructor (form) {
      this._data = []

      const self = this

      form && each(form.elements, elm => {
        if (
          !elm.name ||
          elm.disabled ||
          elm.type === 'submit' ||
          elm.type === 'button' ||
          elm.matches('form fieldset[disabled] *')
        ) return

        if (elm.type === 'file') {
          const files = elm.files && elm.files.length
            ? elm.files
            : [new File([], '', { type: 'application/octet-stream' })] // #78

          each(files, file => {
            self.append(elm.name, file)
          })
        } else if (elm.type === 'select-multiple' || elm.type === 'select-one') {
          each(elm.options, opt => {
            !opt.disabled && opt.selected && self.append(elm.name, opt.value)
          })
        } else if (elm.type === 'checkbox' || elm.type === 'radio') {
          if (elm.checked) self.append(elm.name, elm.value)
        } else {
          const value = elm.type === 'textarea' ? normalizeLinefeeds(elm.value) : elm.value
          self.append(elm.name, value)
        }
      })
    }

    /**
     * Append a field
     *
     * @param   {string}           name      field name
     * @param   {string|Blob|File} value     string / blob / file
     * @param   {string=}          filename  filename to use with blob
     * @return  {undefined}
     */
    append (name, value, filename) {
      ensureArgs(arguments, 2)
      this._data.push(normalizeArgs(name, value, filename))
    }

    /**
     * Delete all fields values given name
     *
     * @param   {string}  name  Field name
     * @return  {undefined}
     */
    delete (name) {
      ensureArgs(arguments, 1)
      const result = []
      name = String(name)

      each(this._data, entry => {
        entry[0] !== name && result.push(entry)
      })

      this._data = result
    }

    /**
     * Iterate over all fields as [name, value]
     *
     * @return {Iterator}
     */
    * entries () {
      for (var i = 0; i < this._data.length; i++) {
        yield normalizeValue(this._data[i])
      }
    }

    /**
     * Iterate over all fields
     *
     * @param   {Function}  callback  Executed for each item with parameters (value, name, thisArg)
     * @param   {Object=}   thisArg   `this` context for callback function
     * @return  {undefined}
     */
    forEach (callback, thisArg) {
      ensureArgs(arguments, 1)
      for (const [name, value] of this) {
        callback.call(thisArg, value, name, this)
      }
    }

    /**
     * Return first field value given name
     * or null if non existen
     *
     * @param   {string}  name      Field name
     * @return  {string|File|null}  value Fields value
     */
    get (name) {
      ensureArgs(arguments, 1)
      const entries = this._data
      name = String(name)
      for (let i = 0; i < entries.length; i++) {
        if (entries[i][0] === name) {
          return normalizeValue(entries[i])[1]
        }
      }
      return null
    }

    /**
     * Return all fields values given name
     *
     * @param   {string}  name  Fields name
     * @return  {Array}         [{String|File}]
     */
    getAll (name) {
      ensureArgs(arguments, 1)
      const result = []
      name = String(name)
      each(this._data, data => {
        data[0] === name && result.push(normalizeValue(data)[1])
      })

      return result
    }

    /**
     * Check for field name existence
     *
     * @param   {string}   name  Field name
     * @return  {boolean}
     */
    has (name) {
      ensureArgs(arguments, 1)
      name = String(name)
      for (let i = 0; i < this._data.length; i++) {
        if (this._data[i][0] === name) {
          return true
        }
      }
      return false
    }

    /**
     * Iterate over all fields name
     *
     * @return {Iterator}
     */
    * keys () {
      for (const [name] of this) {
        yield name
      }
    }

    /**
     * Overwrite all values given name
     *
     * @param   {string}    name      Filed name
     * @param   {string}    value     Field value
     * @param   {string=}   filename  Filename (optional)
     * @return  {undefined}
     */
    set (name, value, filename) {
      ensureArgs(arguments, 2)
      name = String(name)
      const result = []
      const args = normalizeArgs(name, value, filename)
      let replace = true

      // - replace the first occurrence with same name
      // - discards the remaning with same name
      // - while keeping the same order items where added
      each(this._data, data => {
        data[0] === name
          ? replace && (replace = !result.push(args))
          : result.push(data)
      })

      replace && result.push(args)

      this._data = result
    }

    /**
     * Iterate over all fields
     *
     * @return {Iterator}
     */
    * values () {
      for (const [, value] of this) {
        yield value
      }
    }

    /**
     * Return a native (perhaps degraded) FormData with only a `append` method
     * Can throw if it's not supported
     *
     * @return {FormData}
     */
    ['_asNative'] () {
      const fd = new _FormData()

      for (const [name, value] of this) {
        fd.append(name, value)
      }

      return fd
    }

    /**
     * [_blob description]
     *
     * @return {Blob} [description]
     */
    ['_blob'] () {
      return formDataToBlobPolyfill(this)
    }

    /**
     * The class itself is iterable
     * alias for formdata.entries()
     *
     * @return  {Iterator}
     */
    [Symbol.iterator] () {
      return this.entries()
    }

    /**
     * Create the default string description.
     *
     * @return  {string} [object FormData]
     */
    toString () {
      return '[object FormData]'
    }
  }

  if (_match && !_match.matches) {
    _match.matches =
      _match.matchesSelector ||
      _match.mozMatchesSelector ||
      _match.msMatchesSelector ||
      _match.oMatchesSelector ||
      _match.webkitMatchesSelector ||
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s)
        var i = matches.length
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1
      }
  }

  if (stringTag) {
    /**
     * Create the default string description.
     * It is accessed internally by the Object.prototype.toString().
     */
    FormDataPolyfill.prototype[stringTag] = 'FormData'
  }

  // Patch xhr's send method to call _blob transparently
  if (_send) {
    const setRequestHeader = global.XMLHttpRequest.prototype.setRequestHeader

    global.XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      setRequestHeader.call(this, name, value)
      if (name.toLowerCase() === 'content-type') this._hasContentType = true
    }

    global.XMLHttpRequest.prototype.send = function (data) {
      // need to patch send b/c old IE don't send blob's type (#44)
      if (data instanceof FormDataPolyfill) {
        const blob = data['_blob']()
        if (!this._hasContentType) this.setRequestHeader('Content-Type', blob.type)
        _send.call(this, blob)
      } else {
        _send.call(this, data)
      }
    }
  }

  // Patch fetch's function to call _blob transparently
  if (_fetch) {
    global.fetch = function (input, init) {
      if (init && init.body && init.body instanceof FormDataPolyfill) {
        init.body = init.body['_blob']()
      }

      return _fetch.call(this, input, init)
    }
  }

  // Patch navigator.sendBeacon to use native FormData
  if (_sendBeacon) {
    global.navigator.sendBeacon = function (url, data) {
      if (data instanceof FormDataPolyfill) {
        data = data['_asNative']()
      }
      return _sendBeacon.call(this, url, data)
    }
  }

  global['FormData'] = FormDataPolyfill
}

function loadRequestResponsePolyfill () {
  if (!_Request) {
    return // nothing to polyfill
  }
  let isPlatformCheckDone = false
  let isNativeFormDataOperationsSupported = null

  function processBody (body) {
    if (!body) {
      return body
    }
    const isFormDataPolyfillBody =
      body._blob && typeof body._blob === 'function'
    if (isFormDataPolyfillBody) {
      return body._blob()
    }
    const isPartialPolyfillNeeded =
      _FormData &&
      body instanceof _FormData &&
      isPlatformCheckDone &&
      !isNativeFormDataOperationsSupported
    if (isPartialPolyfillNeeded) {
      return formDataToBlobPolyfill(body)
    }
    return body
  }

  global.Request = (function () {
    function Request (input, init) {
      if (init) {
        init.body = processBody(init.body)
      }

      if (arguments.length === 0) return new _Request()
      if (arguments.length === 1) return new _Request(input)
      if (arguments.length > 1) return new _Request(input, init)
    }

    // delegate the instanceof check to check if it compares to native
    // Request instead.
    Object.defineProperty(Request, Symbol.hasInstance, {
      value: function (instance) {
        return instance instanceof _Request
      }
    })

    return Request
  })()

  global.Response = (function () {
    function Response (body, init) {
      const processedBody = processBody(body)

      if (arguments.length === 0) return new _Response()
      if (arguments.length === 1) return new _Response(processedBody)
      if (arguments.length > 1) return new _Response(processedBody, init)
    }

    // delegate the instanceof check to check if it compares to native
    // Request instead.
    Object.defineProperty(Response, Symbol.hasInstance, {
      value: function (instance) {
        return instance instanceof _Response
      }
    })

    return Response
  })()

  global.Request.polyfillPromise = (async function () {
    // we load each part of the Request and Response polyfills as soon as
    // possible to minimise chance of race condition but if the first thing
    // you do when the page loads is call the Request or Response
    // constructor, you should probably `await Request.polyfillPromise`.
    try {
      // The native FormData in Safari (WebKit), where it exists, doesn't
      // support doing Request.arrayBuffer() (or .blob()). In this case, we
      // need a partial polyfill: using the native FormData but polyfill the
      // uses of it.
      await new _Request('z', {
        method: 'POST',
        body: new _FormData()
      }).arrayBuffer()
      isNativeFormDataOperationsSupported = true
    } catch (err) {
      // err will either be
      //  - "The operation is not supported" from the .arrayBuffer() call
      //  - "_FormData is not a constructor"
      isNativeFormDataOperationsSupported = false
    } finally {
      isPlatformCheckDone = true
    }
  })()
}

function formDataToBlobPolyfill (fd) {
  // need to extract this so we can use it even when we don't load FormDataPolyfill
  const boundary = '----formdata-polyfill-' + Math.random()
  const chunks = []

  for (const [name, value] of fd) {
    chunks.push(`--${boundary}\r\n`)

    if (value instanceof Blob) {
      chunks.push(
        `Content-Disposition: form-data; name="${name}"; filename="${value.name}"\r\n` +
        `Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
        value,
        '\r\n'
      )
    } else {
      chunks.push(
        `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    }
  }

  chunks.push(`--${boundary}--`)

  return new Blob(chunks, {
    type: 'multipart/form-data; boundary=' + boundary
  })
}
