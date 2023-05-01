const sequelize = require('./../database/database')
const Sequalize = require('sequelize');


const Orders= sequelize.define('orders', {
    id: {
        field: 'id',
        type: Sequalize.UUID,
        primaryKey: true
    },
    customer_id: {
        field: 'customer_id',
        type: Sequalize.UUID
    },
   amount: {
        field: 'amount',
        type: Sequalize.INTEGER,
    },
    date: {
        field: 'date',
        type: Sequalize.DATE,
    }
},{
    timestamps: false
});

Orders.associate = function(models){
    Orders.hasMany(models.Order_details, {foreignKey: 'order_id'})
  }

  module.exports = Orders;