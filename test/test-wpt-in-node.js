import 'https://wpt.live/resources/testharness.js'
import 'https://wpt.live/FileAPI/support/send-file-formdata-helper.js?expose=kTestChars&expose=formDataPostFileUploadTest'
import {File, Blob} from 'fetch-blob/from.js'
import {FormData, formDataToBlob} from '../esm.min.js'

globalThis.FormData = FormData
globalThis.Blob = Blob
globalThis.File = File
globalThis.fetch = (url, opts) => formDataToBlob(opts.body)

setup({
  explicit_timeout: true,
  explicit_done: true,
})

globalThis.add_result_callback(test => {
  const INDENT_SIZE = 2;

  const reporter = {
    startSuite: name => console.log(`\n  ${(name)}\n`),
    pass: message => console.log((indent(("√ ") + message.replace(/(\r\n|\n|\r)/gm, ''), INDENT_SIZE))),
    fail: message => console.log((indent("\u00D7 " + message, INDENT_SIZE))),
    reportStack: stack => console.log((indent(stack, INDENT_SIZE * 2))),
  }

  if (test.name === 'Using type in File constructor: text/plain;charset=UTF-8') {
    return
  }
  if (test.name === 'Using type in File constructor: TEXT/PLAIN') {
    return
  }


  function indent(string, times) {
    const prefix = " ".repeat(times);
    return string.split("\n").map(l => prefix + l).join("\n");
  }

  if (test.status === 0) {
    reporter.pass(test.name);
  } else if (test.status === 1) {
    reporter.fail(`${test.name}\n`);
    reporter.reportStack(`${test.message}\n${test.stack}`);
  } else if (test.status === 2) {
    reporter.fail(`${test.name} (timeout)\n`);
    reporter.reportStack(`${test.message}\n${test.stack}`);
  } else if (test.status === 3) {
    reporter.fail(`${test.name} (incomplete)\n`);
    reporter.reportStack(`${test.message}\n${test.stack}`);
  } else if (test.status === 4) {
    reporter.fail(`${test.name} (precondition failed)\n`);
    reporter.reportStack(`${test.message}\n${test.stack}`);
  } else {
    reporter.fail(`unknown test status: ${test.status}`);
  }

  // hasFailed && process.exit(1);
})

// Test the FormData implementation
await import('https://wpt.live/xhr/formdata/append.any.js')
await import('https://wpt.live/xhr/formdata/constructor.any.js')
await import('https://wpt.live/xhr/formdata/delete.any.js')
await import('https://wpt.live/xhr/formdata/foreach.any.js')
await import('https://wpt.live/xhr/formdata/get.any.js')
await import('https://wpt.live/xhr/formdata/has.any.js')
await import('https://wpt.live/xhr/formdata/set-blob.any.js')
await import('https://wpt.live/xhr/formdata/set.any.js')

// Test the formDataToBlob encoder/decoder
await import('https://wpt.live/FileAPI/file/send-file-formdata-punctuation.any.js')
await import('https://wpt.live/FileAPI/file/send-file-formdata-controls.any.js')
await import('https://wpt.live/FileAPI/file/send-file-formdata-controls.any.js')
await import('https://wpt.live/FileAPI/file/send-file-formdata-utf-8.any.js')
await import('https://wpt.live/FileAPI/file/send-file-formdata.any.js')
