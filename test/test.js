/* global it describe assert expect Blob FormData */
const native = window.FormData
window.FormData = undefined

class Polyfill {
  constructor (args) {
    return new FormData(args)
  }
}

const NativeFile = window.File
// Want to simulate the kind of error we get in
// old safari & ie when constructing a file
window.File = new Proxy(NativeFile, {
  construct (target, args) {
    throw new Error()
  }
})

;[native, Polyfill].forEach(FormData => {
  function createFormData(...args) {
    const fd = new FormData()
    for (let arg of args) {
      fd.append(...arg)
    }
    return fd
  }

  function create_form(str) {
    var form = document.createElement('form')
    form.innerHTML = str
    return new FormData(form)
  }

  // Some test are imported from
  // http://bit.ly/2zyG5yZ

  describe('FormData ' + (FormData === native ? 'native' : 'polyfill'), () => {
    describe('append', () => {
      it('throwOnFewArgs', () => {
        expect(() => {
          var fd = new FormData()
          fd.append('key')
        }).throw()
      })

      it('testFormDataAppend1', () => {
        assert.equal(createFormData(['key', 'value1']).get('key'), 'value1')
      })

      it('testFormDataAppend2', () => {
        assert.equal(createFormData(['key', 'value2'], ['key', 'value1']).get('key'), 'value2')
      })

      it('testFormDataAppendUndefined1', () => {
        assert.equal(createFormData(['key', undefined]).get('key'), 'undefined')
      })

      it('testFormDataAppendUndefined2', () => {
        assert.equal(createFormData(['key', undefined], ['key', 'value1']).get('key'), 'undefined')
      })

      it('testFormDataAppendNull1', () => {
        assert.equal(createFormData(['key', null]).get('key'), 'null')
      })

      it('testFormDataAppendNull2', () => {
        assert.equal(createFormData(['key', null], ['key', 'value1']).get('key'), 'null')
      })

      it('testFormDataAppendToForm1', () => {
        var fd = new FormData(document.createElement('form'))
        fd.append('key', 'value1')
        assert.equal(fd.get('key'), 'value1')
      })

      it('testFormDataAppendToForm2', () => {
        var fd = new FormData(document.createElement('form'))
        fd.append('key', 'value2')
        fd.append('key', 'value1')
        assert.equal(fd.get('key'), 'value2')
      })

      it('testFormDataAppendToFormUndefined1', () => {
        var fd = new FormData(document.createElement('form'))
        fd.append('key', undefined)
        assert.equal(fd.get('key'), 'undefined')
      })

      it('testFormDataAppendToFormUndefined2', () => {
        var fd = new FormData(document.createElement('form'))
        fd.append('key', undefined)
        fd.append('key', 'value1')
        assert.equal(fd.get('key'), 'undefined')
      })

      it('testFormDataAppendToFormNull1', () => {
        var fd = new FormData(document.createElement('form'))
        fd.append('key', null)
        assert.equal(fd.get('key'), 'null')
      })

      it('testFormDataAppendToFormNull2', () => {
        var fd = new FormData(document.createElement('form'))
        fd.append('key', null)
        fd.append('key', 'value1')
        assert.equal(fd.get('key'), 'null')
      })

      it('testFormDataAppendEmptyBlob', () => {
        var fd = createFormData(['key', new Blob(), 'blank.txt']).get('key')
        assert.equal(fd.name, 'blank.txt')
        assert.equal(fd.type, '')
        assert.equal(fd.size, 0)
      })
    })

    describe('has', () => {
      it('throwOnFewArgs', () => {
        expect(() => {
          var fd = new FormData()
          fd.has()
        }).throw()
      })

      it('FormData.has()', () => {
        var fd = new FormData()
        fd.append('n1', 'value')
        assert.equal(fd.has('n1'), true)
        assert.equal(fd.has('n2'), false)
        fd.append('n2', 'value')
        assert.equal(fd.has('n1'), true)
        assert.equal(fd.has('n2'), true)
        fd.append('n3', new Blob(['content']))
        assert.equal(fd.has('n3'), true)
      })
    })

    describe('delete', () => {
      it('throwOnFewArgs', () => {
        expect(() => {
          var fd = new FormData()
          fd.delete()
        }).throw()
      })

      it('FormData.delete()', () => {
        var fd = new FormData()
        fd.append('name', 'value')
        assert.equal(fd.has('name'), true)
        fd.delete('name')
        assert.equal(fd.has('name'), false)

        fd.append('name', new Blob(['content']))
        assert.equal(fd.has('name'), true)
        fd.delete('name')
        assert.equal(fd.has('name'), false)

        fd.append('n1', 'v1')
        fd.append('n2', 'v2')
        fd.append('n1', 'v3')
        fd.delete('n1')
        assert.equal(fd.has('n1'), false)

        assert.deepEqual([...fd], [['n2', 'v2']])
      })
    })

    describe('filename', () => {
      // #43
      // Old ie don't have Symbol.toStringTag and the polyfill was
      // therefore not able to change the
      // `Object.prototype.toString.call` to return correct type of the polyfilled
      // File constructor
      it('Shold return correct filename with File', () => {
        const fd = createFormData(['key', new NativeFile([], 'doc.txt')])
        const mockFile = fd.get('key')
        assert.equal('doc.txt', mockFile.name)
      })

      it('Shold return correct filename with Blob filename', () => {
        const fd = createFormData(['key', new Blob(), 'doc.txt'])
        const mockFile = fd.get('key')
        assert.equal('doc.txt', mockFile.name)
      })

      it('Shold return correct filename with just Blob', () => {
        const fd = createFormData(['key', new Blob()])
        const mockFile = fd.get('key')
        assert.equal('blob', mockFile.name)
      })
    })

    describe('linebreaks', () => {
      // Native FormData normalizes linefeeds in textareas to CRLF
      // In order to be consistent the polyfill should do the same
      it('Should convert LF to CRLF for textareas', () => {
        // This can not be tested with 'create_form' as the function ignores \n
        const form = document.createElement('form')
        const textarea = document.createElement('textarea')
        textarea.name = 'key'
        textarea.value = '\n'
        form.appendChild(textarea)
        const fd = new FormData(form)
        const value = fd.get('key')
        assert.equal('\r\n', value)
      })

      it('Should convert CR to CRLF for textareas', () => {
        const form = document.createElement('form')
        const textarea = document.createElement('textarea')
        textarea.name = 'key'
        textarea.value = '\r'
        form.appendChild(textarea)
        const fd = new FormData(form)
        const value = fd.get('key')
        assert.equal('\r\n', value)
      })

      it('Should normalize mixed linefeeds to CRLF for textareas', () => {
        const form = document.createElement('form')
        const textarea = document.createElement('textarea')
        textarea.name = 'key'
        textarea.value = 'a\n\ra\r\na\n\r\n\r\n\r\n\na\r\r'
        form.appendChild(textarea)
        const fd = new FormData(form)
        const value = fd.get('key')
        assert.equal('a\r\n\r\na\r\na\r\n\r\n\r\n\r\n\r\na\r\n\r\n', value)
      })

      it('Should not convert LF to CRLF when provided by append', () => {
        const fd = createFormData(['key', '\n'])
        const value = fd.get('key')
        assert.equal('\n', value)
      })

      it('Should not convert CR to CRLF when provided by append', () => {
        const fd = createFormData(['key', '\r'])
        const value = fd.get('key')
        assert.equal('\r', value)
      })
    })

    describe('disabled', () => {
      it('Shold not include disabled fields', () => {
        const fd = create_form(
          `<input disabled name=foo value=bar>`
        )
        assert.deepEqual([...fd], [])
      })

      // #56
      it('Select elements where the option is both selected and disabled should not be included', () => {
        const fd = create_form(`
          <select multiple name="example">
            <option selected disabled value="foo">Please choose one</option>
          </select>
        `)

        assert.equal([...fd].length, 0)
      })
    })

    describe('constructor', () => {
      // #45
      it('Shold return selected items', () => {
        const fd = create_form(`
          <select multiple name="example">
            <option selected value="volvo">Volvo</option>
            <option selected value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </select>
        `)

        assert.deepEqual([...fd], [['example', 'volvo'], ['example', 'saab']])
      })

      // #62
      it('Should not add buttons to FormData', () => {
        const fd = create_form(`
          <input type="text" name="username" value="bob">
          <input type="submit" value="rename" name="action">
          <input type="submit" value="find_n_delete" name="action">
        `)

        assert.deepEqual([...fd], [['username', 'bob']])
      })
    })
  })
})
