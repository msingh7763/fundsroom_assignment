module.exports = (sequelize, DataTypes) => {
  const CustomerOrder = sequelize.define(
    'CustomerOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        defaultValue: 'PENDING',
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerEmail: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
      },
      customerPhone: DataTypes.STRING,
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Reserved', 'Fulfilled', 'Cancelled'),
        defaultValue: 'Pending',
      },
      reservedAt: DataTypes.DATE,
      fulfilledAt: DataTypes.DATE,
      cancelledAt: DataTypes.DATE,
      notes: DataTypes.TEXT,
      createdById: {
        type: DataTypes.UUID,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      updatedById: {
        type: DataTypes.UUID,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeCreate: async (order) => {
          const count = await CustomerOrder.count().catch(() => 0);
          order.orderId = `ORD-${String(count + 1).padStart(6, '0')}`;
        },
      },
    }
  );

  CustomerOrder.associate = (models) => {
    CustomerOrder.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
    CustomerOrder.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    CustomerOrder.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
    CustomerOrder.belongsTo(models.User, { foreignKey: 'updatedById', as: 'updatedBy' });
  };

  return CustomerOrder;
};

