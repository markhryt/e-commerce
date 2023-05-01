const sequelize = require('./../database/database')
const Sequelize = require('sequelize');

module.exports = sequelize.define('customers', {
    id: {
        field: 'id',
        type: Sequelize.UUID,
        primaryKey: true
    },
    email: {
        field: 'email',
        type: Sequelize.STRING
    },
    full_name: {
        field: 'full_name',
        type: Sequelize.STRING,
    },
    address: {
        field: 'address',
        type: Sequelize.STRING
    },
    password: {
        field: 'password',
        type: Sequelize.STRING
    }
},{
    timestamps: false
});
