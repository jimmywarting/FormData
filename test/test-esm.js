import Blob from 'fetch-blob'
import File from 'fetch-blob/file.js'
import {FormData, formDataToBlob} from '../esm.min.js'

console.assert(
  formDataToBlob(createFormData(['key', 'value1'])).size > 100,
  'It can create a blob from FormData'
)

// All of the below code can be executed in the browser as well to spot if the test are doing anything unexpected

function createFormData (...args) {
  const fd = new FormData()
  for (const arg of args) {
    fd.append(...arg)
  }
  return fd
}

console.assert(
  createFormData(['key', 'value1']).get('key') === 'value1',
  'GET: Getting a key value return value1'
)

console.assert(
  createFormData(['key', '1st'], ['key', '2nd']).get('key') === '1st',
  'GET: Getting one of the keys value return the first value'
)

console.assert(
  createFormData().get('key') === null,
  `GET: Getting a key that don't exist returns null`
)

for (let x of [undefined, null, 0, '', {}, false, true, globalThis, NaN]) {
  console.assert(
    createFormData(['key', x]).get('key') === String(x),
    `APPEND: it should normalize none blob values to string`
  )
}


// #120 escapes keys when encoding FormData
for (let [key, expected] of [['key\n', 'key%0A'], ['key\r', 'key%0D'], ['key"', 'key%22']]) {
  const fd = createFormData([key, 'value'])
  const str = await formDataToBlob(fd).text()
  console.assert(str.includes(expected) === true)
}

// #120 escapes filename encoding FormData
for (let [filename, expected] of [['val\nue', 'val%0Aue'], ['val%0Aue', 'val%0Aue']]) {
  const fd = createFormData(['key', new File([], filename)])
  const str = await formDataToBlob(fd).text()
  console.assert(str.includes(expected))
}

{
  // Appending a empty blob with a name should convert it to a File
  var val = createFormData(['key', new Blob(), 'blank.txt']).get('key')
  console.assert(val[Symbol.toStringTag], 'The value should have a symbol toStringTag')
  console.assert(val[Symbol.toStringTag] === 'File', 'the symbol.toStringTag should be "File"')
  console.assert(val.name === 'blank.txt', 'File name should be blank.txt')
  console.assert(val.type === '', 'The blob type should be unspecified')
  console.assert(val.size === 0, 'The size is empty')
}

{
  var fd = createFormData()
  console.assert(fd.has('key1') === false, `HAS: a key that have not been appended or set returns false`)
  fd.append('key1', 'value')
  console.assert(fd.has('key1') === true, `HAS: it has a value after appending to it`)
  console.assert(fd.has('key2') === false, `HAS: a key that have not been appended or set returns false`)
  fd.append('key2', 'value')
  console.assert(fd.has('key1') === true)
  console.assert(fd.has('key2') === true)
  fd.append('key3', new Blob(['content']))
  console.assert(fd.has('key3') === true)
}

{
  const msg = 'should return the keys/values/entres in the order they was appended'
  const entries = [
    ['keyA', 'val1'],
    ['keyA', 'val2'],
    ['keyB', 'val3'],
    ['keyA', 'val4']
  ]

  const fd = createFormData(...entries)
  const keys = [...fd.keys()]+''
  const values = [...fd.values()]+''
  const result = [...fd]+''

  console.assert(keys === 'keyA,keyA,keyB,keyA', msg)
  console.assert(values === 'val1,val2,val3,val4', msg)
  console.assert(result === 'keyA,val1,keyA,val2,keyB,val3,keyA,val4', msg)
}

{
  const fd = createFormData(
    ['keyA', 'val1'],
    ['keyA', 'val2'],
    ['keyB', 'val3'],
    ['keyA', 'val4']
  )
  fd.set('keyA', 'val3')
  console.assert([...fd]+'' === 'keyA,val3,keyB,val3', 'SET: Overwrite first matching key')
}

{
  const fd = createFormData(['keyB', 'val3'])
  fd.set('keyA', 'val3')
  console.assert([...fd]+'' === 'keyB,val3,keyA,val3', 'SET: appends value when no matching key exist')
}

{
  const fd = createFormData(['name', 'value'])
  console.assert(fd.has('name') === true)
  fd.delete('name')
  console.assert(fd.has('name') === false)

  fd.append('name', new Blob(['content']))
  console.assert(fd.has('name') === true)
  fd.delete('name')
  console.assert(fd.has('name') === false)

  fd.append('n1', 'v1')
  fd.append('n2', 'v2')
  fd.append('n1', 'v3')
  fd.delete('n1')
  console.assert(fd.has('n1') === false)

  console.assert([...fd]+'' === 'n2,v2')
}

{
  const value = createFormData(['key', '\n']).get('key')
  console.assert('\n' === value, 'Should not convert LF to CRLF when provided by append')
}

{
  const value = createFormData(['key', '\r']).get('key')
  console.assert('\r' === value, 'Should not convert CR to CRLF when provided by append')
}

{
  const file = createFormData(['key', new File([], 'doc.txt')]).get('key')
  console.assert('doc.txt' === file.name, 'should return correct filename with File')
}

{
  const file = createFormData(['key', new Blob(), 'doc.txt']).get('key')
  console.assert('doc.txt' === file.name, 'should return correct filename with Blob filename')
}

{
  const file = createFormData(['key', new Blob()]).get('key')
  console.assert('blob' === file.name, 'should return correct filename with just Blob')
}

{
  const fd = createFormData(['key', new Blob()])
  console.assert(fd.get('key') === fd.get('key'), 'should return same instances')
}
