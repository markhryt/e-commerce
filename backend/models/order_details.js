const sequelize = require('./../database/database')
const Sequalize = require('sequelize');

const Order_details= sequelize.define('order_details', {
    id: {
        field: 'id',
        type: Sequalize.STRING,
        primaryKey: true
    },
    product_id: {
        field: 'product_id',
        type: Sequalize.INTEGER,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    order_id: {
        field: 'order_id',
        type: Sequalize.UUID,
        references: {
            model: 'orders',
            key: 'id'
        }
    }
    
},{
    timestamps: false
});

Order_details.associate = function(models){
    Products.belongsTo(models.Products, {foreignKey: 'product_id'});
  }

  Order_details.associate = function(models){
    Orders.belongsTo(models.Orders, {foreignKey: 'order_id'});
  }
  module.exports  = Order_details;