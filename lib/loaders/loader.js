import fs from 'fs'
import path from 'path'

const __dirname = path.resolve(path.dirname(''))

async function main(directory) {
  directory = __dirname + '/' + directory
  var normalizedPath = path.join(directory)
  let loadedFilesJson = {}
  const directories = fs.readdirSync(normalizedPath)

  for (let i = 0; i < directories.length; i++) {
    const file = directories[i]

    // import content from directory + '/' + file
    // const content = require(directory + '/' + file)
    //const content = eval(fs.readFileSync(directory + '/' + file) + '')
    await import(directory + '/' + file).then((content) => {
      loadedFilesJson = {
        ...loadedFilesJson,
        [file.replace('.js', '')]: content.default,
      }
    })
    //loadedFilesJson = {
    //  ...loadedFilesJson,
    //  [file.replace('.js', '')]: content,
    //}
  }

  return loadedFilesJson
}

export default main
