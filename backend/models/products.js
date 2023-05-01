const sequelize = require('./../database/database')
const Sequalize = require('sequelize');

 const Products = sequelize.define('products', {
    id: {
      type: Sequalize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: Sequalize.INTEGER,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    name: {
      type: Sequalize.STRING
    },
    img_url: {
      type: Sequalize.STRING
    }
  }, {
    timestamps: false
  });

  Products.associate = function(models){
    Products.belongsTo(models.Categories, {foreignKey: 'category_id'});
  }

  Products.associate = function(models){
    Products.hasMany(models.Order_details, {foreignKey: 'product_id'})
  }
  
  module.exports = Products;