const nativeFormData = window.FormData
const nativeFile = window.File
window.FormData = undefined

// Want to simulate the kind of error we get in
// old safari & ie when constructing a file
window.File = new Proxy(nativeFile, {
  construct(target, args) {
    throw new Error
  }
})

function create_formdata(...args) {
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

describe('FormData', () => {
  describe('append', () => {
    it('testFormDataAppend1', () => {
        assert.equal(create_formdata(['key', 'value1']).get('key'), 'value1')
    })

    it('testFormDataAppend2', () => {
        assert.equal(create_formdata(['key', 'value2'], ['key', 'value1']).get('key'), 'value2')
    })

    it('testFormDataAppendUndefined1', () => {
        assert.equal(create_formdata(['key', undefined]).get('key'), 'undefined')
    })

    it('testFormDataAppendUndefined2', () => {
        assert.equal(create_formdata(['key', undefined], ['key', 'value1']).get('key'), 'undefined')
    })

    it('testFormDataAppendNull1', () => {
        assert.equal(create_formdata(['key', null]).get('key'), 'null')
    })

    it('testFormDataAppendNull2', () => {
        assert.equal(create_formdata(['key', null], ['key', 'value1']).get('key'), 'null')
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
        var fd = create_formdata(['key', new Blob, 'blank.txt']).get('key')
        assert.equal(fd.name, 'blank.txt')
        assert.equal(fd.type, '')
        assert.equal(fd.size, 0)
    })
  })

  describe('has', () => {
    it('FormData.has()', () => {
      var fd = new FormData
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
    it('FormData.delete()', () => {
      var fd = new FormData
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
      const fd = create_formdata(['key', new nativeFile([], 'doc.txt')])
      const mockFile = fd.get('key')
      assert.equal('doc.txt', mockFile.name)
    })

    it('Shold return correct filename with Blob filename', () => {
      const fd = create_formdata(['key', new Blob, 'doc.txt'])
      const mockFile = fd.get('key')
      assert.equal('doc.txt', mockFile.name)
    })

    it('Shold return correct filename with just Blob', () => {
      const fd = create_formdata(['key', new Blob])
      const mockFile = fd.get('key')
      assert.equal('Blob', mockFile.name)
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

  })


})
