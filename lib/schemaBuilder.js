const TypeMap = require('../schemaTypes')
const mysql = require('mysql')
const path = require('path')
const fs = require('fs')

class SchemaBuilder {
  constructor(options) {
    this.options = options
  }
}

module.exports = main

async function main(options) {
  let tables = await filteredTables(options)

  // clear schema folder
  clearFolder(options.outputFolder)

  makeBaseSchema(options)

  for (let index = 0; index < tables.length; index++) {
    tableName = tables[index]
    const graphqlScheme = await extractScheme(tableName, options)

    let modelName = makeSingular(options, tableName)
    modelName = makeCapitalized(modelName)
    modelName = makeCamelCase(modelName)

    await writeToFile(options.outputFolder, modelName, graphqlScheme)
  }
}

async function makeBaseSchema(options) {
  const folder = options.outputFolder
  const baseContent = `type Query { foo: String }`
  await fs.promises.mkdir(folder, { recursive: true }).catch(console.error)
  await fs.promises
    .writeFile(`${folder}base.graphql`, baseContent)
    .catch(console.error)
    .then(console.log(`Saved base graphgql file`))
}

async function filteredTables(options) {
  // get from db
  let tables = await getDatabaseTables()
  tables = tables.map((t) => t.table_name)

  // excluding tables
  tables = tables.filter(
    (table) => options.excludeTables.includes(table) === false
  )

  return !tables ? [] : tables
}

function directoryExists(path) {
  return fs.existsSync(path)
}

function clearFolder(directory) {
  if (!directoryExists(directory)) return

  fs.readdir(directory, (err, files) => {
    if (err && err.code !== 'ENOENT') throw err

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err
      })
    }
  })
}

async function writeToFile(directory, file, content) {
  await fs.promises.mkdir(directory, { recursive: true }).catch(console.error)
  await fs.promises
    .writeFile(`${directory}${file}.graphql`, content)
    .catch(console.error)
    .then(console.log(`Saved ${file}`))
}

async function extractScheme(tableName, options) {
  let graphqlSchema = await mysqlGQL(tableName, options)

  return makeTypeFirstCharUpperCase(graphqlSchema)
}

async function mysqlGQL(tableName, options) {
  let columns = await getDatabaseColumns(tableName)
  let foreigns = await getDatabaseForeigns(tableName)

  return generateGQL(tableName, columns, foreigns, options)
}

function generateGQL(tableName, columns, foreigns, options) {
  tableName = makeCamelCase(tableName)
  tableName = makeTypeFirstCharUpperCase(tableName)

  // save plural for later
  const queriesName = tableName
  const queryName = makeSingular(options, tableName)

  const modelName = makeCapitalized(queryName)

  // build queries
  let gql = generateSqlQuery('', options, queriesName, queryName, modelName)

  // build type
  gql = generateSqlTypeOpening(gql, modelName)
  gql = generateSqlTypeContent(gql, modelName, options, columns, foreigns)
  gql = generateSqlTypeClosing(gql)

  return gql
}

function generateType(column) {
  return TypeMap.hasOwnProperty(column) ? TypeMap[column] : 'unknown'
}

function generateSqlQuery(gql, options, queriesName, queryName, modelName) {
  let generatedSqlKey = `extend type Query`
  let generatedSqlValue = ``
  const middleware = runMiddleware(
    modelName,
    generatedSqlKey,
    generatedSqlValue,
    'query',
    options
  )
  generatedSqlKey = middleware.key
  generatedSqlValue = middleware.value

  gql += `${generatedSqlKey}${generatedSqlValue} {`
  gql += `
    ${queriesName}: [${modelName}!]! @paginate(defaultCount: 10)
    ${queryName}(id: ID! @eq): ${modelName} @find
}
`
  return gql
}

function generateSqlTypeOpening(gql, typeName) {
  gql += `
type ${typeName} {`
  return gql
}

function generateSqlTypeContent(gql, modelName, options, columns, foreigns) {
  gql = generateSqlColumns(gql, modelName, options, columns)
  gql = generateSqlForeigns(gql, modelName, options, foreigns)
  return gql
}

function generateSqlColumns(gql, modelName, options, columns) {
  for (let column of columns) {
    // column name
    let columnName = column.Field
    let directive = isSnakeCase(columnName) ? ' @rsc' : ''
    columnName = makeCamelCase(columnName)

    // column type
    let columnType = column.Type.split('(')[0]
    let schemaType = generateType(columnType)
    if (columnName === 'id') {
      schemaType = 'ID'
    }

    // column comment
    let comment = column.Comment

    let nullable = column.Null === 'NO' ? '!' : ''

    // add comments
    if (comment) {
      comment = comment.replace(/(^.*?)(?=\w)/gm, '    # ')

      gql += `
${comment}`
    }

    let generatedSqlKey = `${columnName}`
    let generatedSqlValue = `${schemaType}${nullable}${directive}`

    const overwrite = runOverwrite(
      modelName,
      generatedSqlKey,
      generatedSqlValue,
      options
    )
    generatedSqlKey = overwrite.key
    generatedSqlValue = overwrite.value
    const middleware = runMiddleware(
      modelName,
      generatedSqlKey,
      generatedSqlValue,
      'column',
      options
    )
    generatedSqlKey = middleware.key
    generatedSqlValue = middleware.value

    let generatedSql = `${generatedSqlKey}: ${generatedSqlValue}`

    // build all together
    gql += `
    ${generatedSql}`
  }

  return gql
}

function generateSqlForeigns(gql, modelName, options, foreigns) {
  if (foreigns && foreigns.length > 0) {
    gql += `
    # models`
    for (let foreign of foreigns) {
      let foreignName = foreign.foreign_table
      foreignName = makeSingular(options, foreignName)
      foreignName = makeCamelCase(foreignName)

      const schemaName = makeCapitalized(foreignName)

      let generatedSqlKey = `${foreignName}`
      let generatedSqlValue = `${schemaName} @belongsTo`

      const overwrite = runOverwrite(
        modelName,
        generatedSqlKey,
        generatedSqlValue,
        options
      )
      generatedSqlKey = overwrite.key
      generatedSqlValue = overwrite.value
      const middleware = runMiddleware(
        modelName,
        generatedSqlKey,
        generatedSqlValue,
        'column',
        options
      )
      generatedSqlKey = middleware.key
      generatedSqlValue = middleware.value

      let generatedSql = `${generatedSqlKey}: ${generatedSqlValue}`

      gql += `
    ${generatedSql}`
    }
  }

  return gql
}

function runOverwrite(modelName, key, value, options) {
  if (options.hasOwnProperty('overwrites') && options.overwrites[modelName]) {
    const overwrites = options.overwrites[modelName] || []

    overwrites.forEach((overwrite) => {
      if (overwrite.hasOwnProperty('testValue')) {
        if (overwrite.hasOwnProperty('testKey')) {
          if (key.match(overwrite.testKey)) {
            value = value.replace(overwrite.testValue, overwrite.replace)
          }
        } else {
          value = value.replace(overwrite.testValue, overwrite.replace)
        }
      } else {
        if (overwrite.hasOwnProperty('testKey')) {
          key = key.replace(overwrite.testKey, overwrite.replace)
        }
      }
    })
  }
  return {
    key: key,
    value: value,
  }
}

function runMiddleware(modelName, key, value, type, options) {
  if (options.hasOwnProperty('middlewares') && options.permissions[modelName]) {
    const middlewares = options.permissions[modelName] || []

    if (type === 'query') {
      if (middlewares.queries) {
        if (middlewares.queries.middleware) {
          value += ` @middleware(checks: ${JSON.stringify(
            middlewares.queries.middleware
          )})`
        }
        if (middlewares.queries.permission) {
          let permissionString = ''
          if (middlewares.queries.permission.hasOwnProperty('role')) {
            permissionString += permissionString !== '' ? ' ' : ''
            permissionString += `role: "${middlewares.queries.permission.role}"`
          }
          if (middlewares.queries.permission.hasOwnProperty('can')) {
            permissionString += permissionString !== '' ? ' ' : ''
            permissionString += `can: "${middlewares.queries.permission.can}"`
          }
          if (middlewares.queries.permission.hasOwnProperty('any')) {
            permissionString += permissionString !== '' ? ' ' : ''
            permissionString += `any: ${JSON.stringify(
              middlewares.queries.permission.any
            )}`
          }
          value += ` @permission(${permissionString})`
        }
      }
    } else if (type === 'column') {
      middlewares.columns.forEach((middleware) => {
        if (key === middleware.key) {
          if (middleware.hasOwnProperty('middleware')) {
            value += ` @middleware(checks: ${JSON.stringify(
              middleware.middleware
            )})`
          }
          let permissionString = ''
          if (middleware.hasOwnProperty('role')) {
            permissionString += permissionString !== '' ? ' ' : ''
            permissionString += `role: "${middleware.role}"`
          }
          if (middleware.hasOwnProperty('can')) {
            permissionString += permissionString !== '' ? ' ' : ''
            permissionString += `can: "${middleware.can}"`
          }
          if (middleware.hasOwnProperty('any')) {
            permissionString += permissionString !== '' ? ' ' : ''
            permissionString += `any: ${JSON.stringify(middleware.any)}`
          }
          value += ` @permission(${permissionString})`
        }
      })
    }
  }

  return {
    key: key,
    value: value,
  }
}

function generateSqlTypeClosing(gql) {
  // closing type
  gql += `
}
`
  return gql
}

function makeSingular(options, str) {
  if (
    options.singularExclude &&
    options.singularExclude.includes(str.toLowerCase())
  ) {
    return str
  }
  str = str.replace(/ies$/, 'y')
  return str.replace(/s$/, '')
}

function makeCapitalized(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function makeTypeFirstCharUpperCase(graphqlSchema) {
  regex = /type\s([a-z])/gm
  return graphqlSchema.replace(regex, (match, a) => {
    return 'type ' + a.toUpperCase()
  })
}

function makeCamelCase(str) {
  return str.replace(/([a-z])_([a-z])/gm, (match, a, b) => {
    return a + b.toUpperCase()
  })
}

function isSnakeCase(str) {
  return str.match(/([a-z])_([a-z])/gm)
}

async function getDatabaseColumns(tableName) {
  let connection = mysql.createConnection(connectionOptions)
  return new Promise((resolve, reject) => {
    connection.query(`SHOW FULL FIELDS FROM ${tableName}`, function (
      error,
      results,
      fields
    ) {
      if (error) {
        connection.end()
        return reject(error)
      }
      connection.end()
      return resolve(results)
    })
  })
}

async function getDatabaseForeigns(tableName) {
  let connection = mysql.createConnection(connectionOptions)

  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT CONSTRAINT_SCHEMA, REFERENCED_TABLE_NAME as foreign_table FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE TABLE_NAME = '${tableName}' AND CONSTRAINT_SCHEMA = '${connectionOptions.database}' GROUP BY foreign_table`,
      function (error, results, fields) {
        if (error) {
          connection.end()
          return reject(error)
        }
        connection.end()
        return resolve(results)
      }
    )
  })
}

async function getDatabaseTables() {
  let connection = mysql.createConnection(connectionOptions)
  return new Promise((resolve, reject) => {
    connection.query(
      `
                SELECT table_name
                FROM information_schema.tables
                where TABLE_SCHEMA = '${connectionOptions.database}'
            `,
      function (error, results) {
        if (error) {
          connection.end()
          return reject(error)
        }
        connection.end()
        return resolve(results)
      }
    )
  })
}

const connectionOptions = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
}
