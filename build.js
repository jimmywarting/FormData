const https = require('https')
const fs = require('fs')
const { URLSearchParams } = require('url')

// This is an async file read
const code = fs.readFileSync('./FormData.js', 'utf8').toString()

// Build the post string from an object
const post_data = new URLSearchParams({
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  output_format: 'text',
  output_info: 'compiled_code',
  warning_level: 'QUIET',
  js_code: code
}).toString()

// An object of options to indicate where to post to
const post_options = {
  host: 'closure-compiler.appspot.com',
  path: '/compile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(post_data)
  }
}

// Set up the request
const post_req = https.request(post_options, res => {
  res.setEncoding('utf8')

  if (res.statusCode !== 200) {
    console.log('FATAL An error occurred trying to use closure compiler')
    process.exit(-2)
  }

  res.pipe(fs.createWriteStream('formdata.min.js'))
})

// post the data
post_req.write(post_data)
post_req.end()
