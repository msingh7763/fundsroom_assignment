module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    'Item',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Item name is required' },
        },
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'SKU is required' },
        },
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Category is required' },
        },
      },
      unit: {
        type: DataTypes.STRING,
        defaultValue: 'pcs',
      },
      description: DataTypes.TEXT,
      minStockLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
    }
  );

  Item.associate = (models) => {
    Item.hasMany(models.Inventory, { foreignKey: 'itemId', as: 'inventories' });
    Item.hasMany(models.WorkOrder, { foreignKey: 'itemId', as: 'workOrders' });
    Item.hasMany(models.Transfer, { foreignKey: 'itemId', as: 'transfers' });
    Item.hasMany(models.CustomerOrder, { foreignKey: 'itemId', as: 'orders' });
  };

  return Item;
};

