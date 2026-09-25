module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    'Location',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'Location name is required' },
        },
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'Location code is required' },
        },
      },
      description: DataTypes.TEXT,
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
    }
  );

  Location.associate = (models) => {
    Location.hasMany(models.Inventory, { foreignKey: 'locationId', as: 'inventories' });
    Location.hasMany(models.WorkOrder, { foreignKey: 'locationId', as: 'workOrders' });
  };

  return Location;
};

