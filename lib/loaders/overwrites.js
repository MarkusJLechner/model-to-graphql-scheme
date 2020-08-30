const loader = require('./loader')
// Every value
// Model; [
//   {
//       testValue: /Int/,
//       replace: 'Boolean'
//   }
// ]
// Replace value where key
// Model; [
//   {
//       testKey: /numberRange/,
//       testValue: /Int/,
//       replace: 'Boolean'
//   }
// ]
// Replace key
// Model; [
//   {
//       testKey: /numberRange/,
//       replace: '$1s'
//   }
// ]

module.exports = loader('overwrites')
