import SchemaBuilder from './lib/schemaBuilder.js'

import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import loaderOverwrites from './lib/loaders/overwrites.js'
import loaderPermissions from './lib/loaders/permissions.js'

async function main() {
  let overwrites = []
  let permissions = {}
  await loaderOverwrites.then((content) => (overwrites = content))
  await loaderPermissions.then((content) => (permissions = content))

  // output folder where the generated .graphql schemes are saved
  const outputFolder = `output/Models/Generated/`

  // options:
  //  excludeTables:   tables without laravel models or pivot tables
  //  singularExclude: laravel models without singular transformation (e.g News)
  //  overwrites:      see ./overwrites folder
  //  permissions:     see ./permissions folder

  const options = {
    excludeTables: [
      'jobs',
      'permissions',
      'order_positions_reporting_tags',
      'migrations',
      'password_resets',
      'roles',
      'model_has_roles',
      'role_has_permissions',
      'model_has_permissions',
      'tracking_visits',

      'article_package',
      'discounts_packages',
      'packages_categories',
      'articles_attachments',
      'invoice_cancellations',
      'articles_reporting_tags',
      'articles_search_parameters',
      'packages_search_parameters',
      'packages_attachments',
      'customer_email_attachments',
      'discounts_articles',
    ],
    singularExclude: ['news'],
    outputFolder: outputFolder,
    overwrites: overwrites,
    middlewares: permissions,
  }

  // require('dotenv').config({ path: '.env' })

  // const schemaBuilder = require(__dirname + '/lib/schemaBuilder')
  //new mainFunction(options)

  const sb = SchemaBuilder(options)
}

main()
