var s = 0,
    S =
    { PARSER_UNINITIALIZED: s++,
      START: s++,
      START_BOUNDARY: s++,
      HEADER_FIELD_START: s++,
      HEADER_FIELD: s++,
      HEADER_VALUE_START: s++,
      HEADER_VALUE: s++,
      HEADER_VALUE_ALMOST_DONE: s++,
      HEADERS_ALMOST_DONE: s++,
      PART_DATA_START: s++,
      PART_DATA: s++,
      PART_END: s++,
      END: s++
    },

    f = 1,
    F =
    { PART_BOUNDARY: f,
      LAST_BOUNDARY: f *= 2
    },

    LF = 10,
    CR = 13,
    SPACE = 32,
    HYPHEN = 45,
    COLON = 58,
    A = 97,
    Z = 122,

    lower = function(c) {
      return c | 0x20;
    }

async function * multipartParser (str, iterator) {
  let encoder = new TextEncoder()
  let decoder = new TextDecoder()
  let boundary = encoder.encode('\r\n--' + str)
  let boundaryChars = {}
  let lookbehind = new Uint8Array(boundary.length + 8)
  let state = S.START
  let index = null
  let flags = 0
  let boundaryLength = boundary.length
  let boundaryEnd = boundaryLength - 1

  for await (let ui8a of iterator) {
      let i = 0,
      len = ui8a.length,
      prevIndex = index,
      bufferLength = ui8a.length,
      c,
      cl,
      mark = function (name) {
        self[name + 'Mark'] = i
      },
      clear = function (name) {
        delete self[name + 'Mark']
      },
      callback = function (name, start, end, ui8a) {
      if (start !== undefined && start === end) {
        return
      }

      var callbackSymbol = 'on' + name.substr(0, 1).toUpperCase() + name.substr(1)
      if (callbackSymbol in self) {
        self[callbackSymbol](start, end, ui8a)
      }
    },
    dataCallback = function (name, clear) {
      var markSymbol = name + 'Mark'
      if (!(markSymbol in self)) {
        return
      }

      if (!clear) {
        callback(name, self[markSymbol], ui8a.length, ui8a)
        self[markSymbol] = 0
      } else {
        callback(name, self[markSymbol], i, ui8a)
        delete self[markSymbol]
      }
    }

    for (i = 0; i < len; i++) {
      c = ui8a[i]

      switch (state) {
        case S.PARSER_UNINITIALIZED:
          return i
        case S.START:
          index = 0
          state = S.START_BOUNDARY
        case S.START_BOUNDARY:
          if (index == boundary.length - 2) {
            if (c == HYPHEN) {
              flags |= F.LAST_BOUNDARY
            } else if (c != CR) {
              return i
            }
            index++
            break
          } else if (index - 1 == boundary.length - 2) {
            if (flags & F.LAST_BOUNDARY && c == HYPHEN) {
              callback('end')
              state = S.END
              flags = 0
            } else if (!(flags & F.LAST_BOUNDARY) && c == LF) {
              index = 0
              callback('partBegin')
              state = S.HEADER_FIELD_START
            } else {
              return i
            }
            break
          }

          if (c != boundary[index + 2]) {
            index = -2
          }
          if (c == boundary[index + 2]) {
            index++
          }
          break
        case S.HEADER_FIELD_START:
          state = S.HEADER_FIELD
          mark('headerField')
          index = 0
        case S.HEADER_FIELD:
          if (c == CR) {
            clear('headerField')
            state = S.HEADERS_ALMOST_DONE
            break
          }

          index++
          if (c == HYPHEN) {
            break
          }

          if (c == COLON) {
            if (index == 1) {
              // empty header field
              return i
            }
            dataCallback('headerField', true)
            state = S.HEADER_VALUE_START
            break
          }

          cl = lower(c)
          if (cl < A || cl > Z) {
            return i
          }
          break
        case S.HEADER_VALUE_START:
          if (c == SPACE) {
            break
          }

          mark('headerValue')
          state = S.HEADER_VALUE
        case S.HEADER_VALUE:
          if (c == CR) {
            dataCallback('headerValue', true)
            callback('headerEnd')
            state = S.HEADER_VALUE_ALMOST_DONE
          }
          break
        case S.HEADER_VALUE_ALMOST_DONE:
          if (c != LF) {
            return i
          }
          state = S.HEADER_FIELD_START
          break
        case S.HEADERS_ALMOST_DONE:
          if (c != LF) {
            return i
          }

          callback('headersEnd')
          state = S.PART_DATA_START
          break
        case S.PART_DATA_START:
          state = S.PART_DATA
          mark('partData')
        case S.PART_DATA:
          prevIndex = index

          if (index === 0) {
            // boyer-moore derrived algorithm to safely skip non-boundary data
            i += boundaryEnd
            while (i < bufferLength && !(ui8a[i] in boundaryChars)) {
              i += boundaryLength
            }
            i -= boundaryEnd
            c = ui8a[i]
          }

          if (index < boundary.length) {
            if (boundary[index] == c) {
              if (index === 0) {
                dataCallback('partData', true)
              }
              index++
            } else {
              index = 0
            }
          } else if (index == boundary.length) {
            index++
            if (c == CR) {
              // CR = part boundary
              flags |= F.PART_BOUNDARY
            } else if (c == HYPHEN) {
              // HYPHEN = end boundary
              flags |= F.LAST_BOUNDARY
            } else {
              index = 0
            }
          } else if (index - 1 == boundary.length) {
            if (flags & F.PART_BOUNDARY) {
              index = 0
              if (c == LF) {
                // unset the PART_BOUNDARY flag
                flags &= ~F.PART_BOUNDARY
                callback('partEnd')
                callback('partBegin')
                state = S.HEADER_FIELD_START
                break
              }
            } else if (flags & F.LAST_BOUNDARY) {
              if (c == HYPHEN) {
                callback('partEnd')
                callback('end')
                state = S.END
                flags = 0
              } else {
                index = 0
              }
            } else {
              index = 0
            }
          }

          if (index > 0) {
            // when matching a possible boundary, keep a lookbehind reference
            // in case it turns out to be a false lead
            lookbehind[index - 1] = c
          } else if (prevIndex > 0) {
            // if our boundary turned out to be rubbish, the captured lookbehind
            // belongs to partData
            let _lookbehind = new Uint8Array(lookbehind.buffer, lookbehind.byteOffset, lookbehind.byteLength)
            callback('partData', 0, prevIndex, _lookbehind)
            prevIndex = 0
            mark('partData')

            // reconsider the current character even so it interrupted the sequence
            // it could be the beginning of a new sequence
            i--
          }

          break
        case S.END:
          break
        default:
          return i
      }
    }

    dataCallback('headerField')
    dataCallback('headerValue')
    dataCallback('partData')

    this.index = index
    this.state = state
    this.flags = flags

    return len
  }
  end() {
    var callback = function (self, name) {
      var callbackSymbol = 'on' + name.substr(0, 1).toUpperCase() + name.substr(1)
      if (callbackSymbol in self) {
        self[callbackSymbol]()
      }
    }
    if ((this.state == S.HEADER_FIELD_START && this.index === 0) ||
      (this.state == S.PART_DATA && this.index == this.boundary.length)) {
      callback(this, 'partEnd')
      callback(this, 'end')
    } else if (this.state != S.END) {
      return new Error('MultipartParser.end(): stream ended unexpectedly')
    }
  }
}

function uint8toStr(uint8Arr) {
  return String.fromCharCode.apply(null, uint8Arr)
}

function _fileName(headerValue) {
  // matches either a quoted-string or a token (RFC 2616 section 19.5.1)
  var m = headerValue.match(/\bfilename=("(.*?)"|([^\(\)<>@,;:\\"\/\[\]\?=\{\}\s\t/]+))($|;\s)/i);
  if (!m) return;

  var match = m[2] || m[3] || '';
  var filename = match.substr(match.lastIndexOf('\\') + 1);
  filename = filename.replace(/%22/g, '"');
  filename = filename.replace(/&#([\d]{4});/g, function(m, code) {
    return String.fromCharCode(code);
  });
  return filename;
}

function toFormData() {
  var self = this
  var parser = new MultipartParser,
      part,
      headerField,
      headerValue,
      fd = new FormData

  parser.onPartBegin = function() {
    part = {data: []};
    headerField = '';
    headerValue = '';
  };
  parser.onHeaderField = function(start, end, ui8a) {
    headerField += uint8toStr(ui8a.slice(start, end))
  }
  parser.onHeaderValue = function(start, end, ui8a) {
    headerValue += uint8toStr(ui8a.slice(start, end))
  }
  parser.onHeaderEnd = function() {
    headerField = headerField.toLowerCase();

    // matches either a quoted-string or a token (RFC 2616 section 19.5.1)
    var m = headerValue.match(/\bname=("([^"]*)"|([^\(\)<>@,;:\\"\/\[\]\?=\{\}\s\t/]+))/i);
    if (headerField === 'content-disposition') {
      if (m) {
        part.name = m[2] || m[3] || '';
      }

      part.filename = _fileName(headerValue);
    } else if (headerField == 'content-type') {
      part.type = headerValue;
    } else if (headerField == 'content-transfer-encoding') {
      part.transferEncoding = headerValue.toLowerCase();
    }

    headerField = ''
    headerValue = ''
  }
  parser.onPartData = function(start, end, ui8a) {
    part.data.push(ui8a.slice(start, end))
  }
  parser.onPartEnd = function() {
    console.log(part)
    if (part.filename === undefined) {
      fd.append(part.name, part.data.map(uint8toStr).join(''))
    } else {
      var blob = new Blob(part.data, {type: part.type})
      fd.append(part.name, blob, part.filename)
    }
  }

  // The actual part that belongs more to Body.formData implementation
  return new Promise(function(rs){
    var ct = self.headers.get('content-type')
    if (ct.match(/multipart/i)) {
      var m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      if (m) {
        parser.initWithBoundary(m[1] || m[2]);
        return rs(self.arrayBuffer())
      }
    }

    throw new TypeError('no or bad content-type header, no multipart boundary');
  })
  .then(function(arrayBuffer) {
    parser.write(new Uint8Array(arrayBuffer))
    return fd
  })
  .catch(function(err) {
    console.log(err)
    throw new TypeError('Failed to fetch')
  })
}
