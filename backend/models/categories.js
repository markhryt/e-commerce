const sequelize = require('./../database/database')
const Sequalize = require('sequelize');

const Categories = sequelize.define('categories', {
    id: {
      type: Sequalize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequalize.STRING
    }
  }, {
    timestamps: false
  });
  
Categories.associate = function(models){
    Categories.hasMany(models.Products, {foreignKey: 'category_id'})
}

module.exports = Categories;