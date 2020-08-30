const loader = require('./loader');
// Model {
//         queries: ['restrict.shop', 'jwt.auth'],
//         columns: [
//             {
//                 key: 'description',
//                 role: 'super-admin',
//                 can: 'read orders',
//                 any: ['read orders']
//             }
//         ]
//     }

module.exports = loader('permissions');
