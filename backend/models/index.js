const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

// Import model definitions
const User = require('./User');
const Location = require('./Location');
const Item = require('./Item');
const Inventory = require('./Inventory');
const WorkOrder = require('./WorkOrder');
const Transfer = require('./Transfer');
const CustomerOrder = require('./CustomerOrder');

// Initialize all models
const models = {
  User: User(sequelize, DataTypes),
  Location: Location(sequelize, DataTypes),
  Item: Item(sequelize, DataTypes),
  Inventory: Inventory(sequelize, DataTypes),
  WorkOrder: WorkOrder(sequelize, DataTypes),
  Transfer: Transfer(sequelize, DataTypes),
  CustomerOrder: CustomerOrder(sequelize, DataTypes),
};

// Define associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = { ...models, sequelize };
