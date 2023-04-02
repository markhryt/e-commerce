const Sequalize = require('sequelize');

module.exports =  new Sequalize('commerce', 'markhrytchak', '', {
    host: 'localhost',
    dialect: 'postgres'
});

