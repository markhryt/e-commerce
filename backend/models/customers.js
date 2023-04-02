const sequelize = require('./../database/database')
const Sequalize = require('sequelize');

module.exports = sequelize.define('customers', {
    id: {
        field: 'id',
        type: Sequalize.UUID,
        primaryKey: true
    },
    email: {
        field: 'email',
        type: Sequalize.STRING
    },
    full_name: {
        field: 'full_name',
        type: Sequalize.STRING,
    },
    address: {
        field: 'address',
        type: Sequalize.STRING
    },
    password: {
        field: 'password',
        type: Sequalize.STRING
    }
},{
    timestamps: false
});
