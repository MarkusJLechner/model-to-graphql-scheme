import fs from 'fs'
import path from 'path'

const __dirname = path.resolve(path.dirname(''))

function main(directory) {
  directory = __dirname + '/' + directory
  var normalizedPath = path.join(directory)
  let loadedFilesJson = {}
  fs.readdirSync(normalizedPath).forEach(function (file) {
    // import content from directory + '/' + file
    // const content = require(directory + '/' + file)
    const content = eval(fs.readFileSync(directory + '/' + file) + '')
    loadedFilesJson = {
      ...loadedFilesJson,
      [file.replace('.js', '')]: content,
    }
  })

  return loadedFilesJson
}

export default main
