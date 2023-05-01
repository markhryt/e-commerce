const Sequelize = require('sequelize');

module.exports =  new Sequelize('commerce', 'markhrytchak', '', {
    host: 'localhost',
    dialect: 'postgres'
});

