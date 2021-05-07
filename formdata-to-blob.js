/**
 * pure function to convert any formData instance to a Blob
 * instances syncronus without reading all of the files
 *
 * @param {FormData} formData an instance of a formData Class
 * @param {Blob|*} [BlobClass=Blob] the Blob class to use when constructing it
 */
export function formDataToBlob (formData, BlobClass = Blob) {
  const boundary = '----formdata-' + Math.random()
  const chunks = []

  for (const [name, value] of formData) {
    chunks.push(`--${boundary}\r\n`)

    typeof value === 'string'  
      ? chunks.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`) 
      : chunks.push(
        `Content-Disposition: form-data; name="${name}"; filename="${value.name}"\r\n` +
        `Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
        value,
        '\r\n'
      )

    chunks.push(`--${boundary}--`)
  }

  return new BlobClass(chunks, {
    type: 'multipart/form-data; boundary=' + boundary
  })
}
