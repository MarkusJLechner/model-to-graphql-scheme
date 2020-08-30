import loader from './loader.js'
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

export default loader('permissions')
