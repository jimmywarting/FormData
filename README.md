# FormData
A FormData polyfill

Ment to be used with babel, closer-compiler or equivulant (since it's written in es6 using class, WeakMap, Iterators, for..of)

This dosn't monkey patch xhr#send like [Rob--W](https://github.com/Rob--W) did [here](https://gist.github.com/Rob--W/8b5adedd84c0d36aba64)
This dose however provide you with way to convert the entiere form to a blob and send it with xhr or fetch
```javascript
fd = new FormData(form)
blob = fd._blob()

xhr.send(blob) // Do this...
xhr.send(fd) // This don't work... Needs to be a native FormData
```

> The reason why Rob--W's version didn't work for me was that it only works in web workes due to FileReaderSync beeing used. I did it with constructing new chunks with the blob constructor instead. `new Blob([string, blob, file, etc])`

The current status of the native FormData is this
![skarmavbild 2016-10-19 kl 21 32 19](https://cloud.githubusercontent.com/assets/1148376/19534352/b7f42d8c-9643-11e6-91da-7f89580f51d8.png)


This lib provides you with all the function others don't include
 - append with filename	
 - delete(), get(), getAll(), has(), set()
 - entries(), keys(), values(), and support of for...of
 - Available in web workers	(yes, just include it...)
