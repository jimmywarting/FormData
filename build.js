import { writeFileSync } from 'node:fs'
import closure from 'google-closure-compiler'

const ClosureCompiler = closure.compiler

const closureCompiler = new ClosureCompiler({
  js: 'FormData.js',
  warning_level: 'QUIET',
  output_wrapper: '/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */\n;(function(){%output%})();',
  compilation_level: 'ADVANCED'
})

closureCompiler.run((exitCode, stdOut, stdErr) => {
  if (exitCode) {
    console.log('FATAL An error occurred trying to use closure compiler')
    console.log(stdErr)
    process.exit(-2)
  }

  writeFileSync('formdata.min.js', stdOut)
})
