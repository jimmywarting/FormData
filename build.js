import https from 'https'
import fs from 'fs'
import { URLSearchParams } from 'url'

// This is an async file read
const code = fs.readFileSync('./FormData.js', 'utf8').toString()

// Build the post string from an object
const postData = new URLSearchParams({
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  output_format: 'text',
  output_info: 'compiled_code',
  warning_level: 'QUIET',
  output_wrapper: '/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */\n;(function(){%output%})();',
  js_code: code
}).toString()

// An object of options to indicate where to post to
const options = {
  host: 'closure-compiler.appspot.com',
  path: '/compile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
}

// Set up the request
const req = https.request(options, res => {
  res.setEncoding('utf8')

  if (res.statusCode !== 200) {
    console.log('FATAL An error occurred trying to use closure compiler')
    process.exit(-2)
  }

  res.pipe(fs.createWriteStream('formdata.min.js'))
})

// post the data
req.write(postData)
req.end()
