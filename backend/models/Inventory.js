module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    'Inventory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Items',
          key: 'id',
        },
      },
      locationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Locations',
          key: 'id',
        },
      },
      batch: {
        type: DataTypes.STRING,
        defaultValue: 'DEFAULT',
      },
      physicalQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      reservedQty: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ['itemId', 'locationId', 'batch'],
          unique: true,
          name: 'unique_item_location_batch',
        },
      ],
    }
  );

  // Pre-save hook to validate physicalQty >= reservedQty
  Inventory.beforeSave(async (inv) => {
    if (inv.physicalQty < inv.reservedQty) {
      throw new Error(
        `Physical quantity (${inv.physicalQty}) cannot be less than reserved quantity (${inv.reservedQty})`
      );
    }
  });

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
    Inventory.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
  };

  // Virtual getter for availableQty
  Inventory.prototype.getAvailableQty = function () {
    return this.physicalQty - this.reservedQty;
  };

  return Inventory;
};

