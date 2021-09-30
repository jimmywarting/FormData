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
for (let [key, expected] of [['key\n', 'key%0D%0A'], ['key\r', 'key%0D%0A'], ['key"', 'key%22']]) {
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

class FormDataLike {
  append(){}
  set(){}
  get(){}
  getAll(){}
  delete(){}
  keys(){}
  values(){}
  entries(){}
  forEach(){}
  get [Symbol.toStringTag](){ return 'FormData' }
}

console.assert(new FormDataLike() instanceof FormData, 'It should be a formdata like object')
console.assert(!(null instanceof FormData), 'null check dont throw')
console.assert(new FormData() instanceof FormData, 'instance check works')

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

{
  var fd = new FormData()
  fd.set('a', 'a\na')
  fd.set('b', 'b\rb')
  fd.set('c', 'c\n\rc')

  console.assert(fd.get('a') === 'a\na')
  console.assert(fd.get('b') === 'b\rb')
  console.assert(fd.get('c') === 'c\n\rc')

  formDataToBlob(fd).text().then(str => {
    console.assert(str.includes('a\r\na'))
    console.assert(str.includes('b\r\nb'))
    console.assert(str.includes('c\r\n\r\nc'))
  })
}

const kTestChars = "ABC~‾¥≈¤･・•∙·☼★星🌟星★☼·∙•・･¤≈¥‾~XYZ"

// formDataPostFileUploadTest - verifies multipart upload structure and
// numeric character reference replacement for filenames, field names,
// and field values using FormData and fetch().
//
// Uses /fetch/api/resources/echo-content.py to echo the upload
// POST (unlike in send-file-form-helper.js, here we expect all
// multipart/form-data request bodies to be UTF-8, so we don't need to
// escape controls and non-ASCII bytes).
//
// Fields in the parameter object:
//
// - fileNameSource: purely explanatory and gives a clue about which
//   character encoding is the source for the non-7-bit-ASCII parts of
//   the fileBaseName, or Unicode if no smaller-than-Unicode source
//   contains all the characters. Used in the test name.
// - fileBaseName: the not-necessarily-just-7-bit-ASCII file basename
//   used for the constructed test file. Used in the test name.
async function formDataPostFileUploadTest(fileBaseName, asBlob = false) {
  const formData = new FormData();
  const file = new File([kTestChars], fileBaseName, { type: "text/plain" });

  // Used to verify that the browser agrees with the test about
  // field value replacement and encoding independently of file system
  // idiosyncracies.
  formData.append("filename", fileBaseName);

  // Same, but with name and value reversed to ensure field names
  // get the same treatment.
  formData.append(fileBaseName, "filename");

  formData.append("file", file, fileBaseName);

  const formDataText = await formDataToBlob(formData).text()
  const formDataLines = formDataText.split("\r\n")
  if (formDataLines.length && !formDataLines[formDataLines.length - 1]) {
    formDataLines.length--
  }
  console.assert(formDataLines.length > 2, `${fileBaseName}: multipart form data must have at least 3 lines: ${
    JSON.stringify(formDataText)
  }`)

  const boundary = formDataLines[0];
  console.assert(
    formDataLines[formDataLines.length - 1] === boundary + "--",
    `${fileBaseName}: multipart form data must end with ${boundary}--: ${
      JSON.stringify(formDataText)
    }`,
  );

  const asValue = fileBaseName.replace(/\r\n?|\n/g, "\r\n");
  const asName = asValue.replace(/[\r\n"]/g, encodeURIComponent);
  const asFilename = fileBaseName.replace(/[\r\n"]/g, encodeURIComponent);
  const expectedText = [
    boundary,
    'Content-Disposition: form-data; name="filename"',
    "",
    asValue,
    boundary,
    `Content-Disposition: form-data; name="${asName}"`,
    "",
    "filename",
    boundary,
    `Content-Disposition: form-data; name="file"; ` +
    `filename="${asFilename}"`,
    "Content-Type: text/plain",
    "",
    kTestChars,
    boundary + "--",
  ].join("\r\n")

  console.assert(
    formDataText.startsWith(expectedText),
    `Unexpected multipart-shaped form data received:\n${formDataText}\nExpected:\n${expectedText}`,
  )
}

await formDataPostFileUploadTest("file-for-upload-in-form.txt")
await formDataPostFileUploadTest("file-for-upload-in-form-\uF7F0\uF793\uF783\uF7A0.txt")
await formDataPostFileUploadTest("file-for-upload-in-form-â˜ºðŸ˜‚.txt")
await formDataPostFileUploadTest("file-for-upload-in-form-★星★.txt")
await formDataPostFileUploadTest("file-for-upload-in-form-☺😂.txt")
await formDataPostFileUploadTest(`file-for-upload-in-form-${kTestChars}.txt`)

await formDataPostFileUploadTest("file-for-upload-in-form.txt")
await formDataPostFileUploadTest("file-for-upload-in-form-NUL-[\0].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-BS-[\b].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-VT-[\v].txt")

// These have characters that undergo processing in name=,
// filename=, and/or value; formDataPostFileUploadTest postprocesses
// expectedEncodedBaseName for these internally.
await formDataPostFileUploadTest("file-for-upload-in-form-LF-[\n].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-LF-CR-[\n\r].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-CR-[\r].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-CR-LF-[\r\n].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-HT-[\t].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-FF-[\f].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-DEL-[\x7F].txt")

// The rest should be passed through unmodified:
await formDataPostFileUploadTest("file-for-upload-in-form-ESC-[\x1B].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-SPACE-[ ].txt")


// These have characters that undergo processing in name=,
// filename=, and/or value; formDataPostFileUploadTest postprocesses
// expectedEncodedBaseName for these internally.
await formDataPostFileUploadTest("file-for-upload-in-form-QUOTATION-MARK-[\x22].txt")
await formDataPostFileUploadTest('"file-for-upload-in-form-double-quoted.txt"')
await formDataPostFileUploadTest("file-for-upload-in-form-REVERSE-SOLIDUS-[\\].txt")

// The rest should be passed through unmodified:
await formDataPostFileUploadTest("file-for-upload-in-form-EXCLAMATION-MARK-[!].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-DOLLAR-SIGN-[$].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-PERCENT-SIGN-[%].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-AMPERSAND-[&].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-APOSTROPHE-['].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-LEFT-PARENTHESIS-[(].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-RIGHT-PARENTHESIS-[)].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-ASTERISK-[*].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-PLUS-SIGN-[+].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-COMMA-[,].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-FULL-STOP-[.].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-SOLIDUS-[/].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-COLON-[:].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-SEMICOLON-[;].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-EQUALS-SIGN-[=].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-QUESTION-MARK-[?].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-CIRCUMFLEX-ACCENT-[^].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-LEFT-SQUARE-BRACKET-[[].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-RIGHT-SQUARE-BRACKET-[]].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-LEFT-CURLY-BRACKET-[{].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-VERTICAL-LINE-[|].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-RIGHT-CURLY-BRACKET-[}].txt")
await formDataPostFileUploadTest("file-for-upload-in-form-TILDE-[~].txt")
await formDataPostFileUploadTest("'file-for-upload-in-form-single-quoted.txt'")
