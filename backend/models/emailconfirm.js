const sequelize = require('./../database/database')
const Sequelize = require('sequelize');

module.exports = sequelize.define('emailconfirm', {
    email: {
        field: 'email',
        type: Sequelize.STRING,
        primaryKey: true
    },
    code: {
        field: 'code',
        type: Sequelize.INTEGER
    }
},{
    timestamps: false
});
