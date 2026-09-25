module.exports = (sequelize, DataTypes) => {
  const Transfer = sequelize.define(
    'Transfer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transferId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        defaultValue: 'PENDING',
      },
      sourceLocationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Locations',
          key: 'id',
        },
      },
      destLocationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Locations',
          key: 'id',
        },
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Items',
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
        type: DataTypes.ENUM('Requested', 'Dispatched', 'Received', 'Cancelled'),
        defaultValue: 'Requested',
      },
      dispatchedAt: DataTypes.DATE,
      receivedAt: DataTypes.DATE,
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
        beforeCreate: async (transfer) => {
          const count = await Transfer.count().catch(() => 0);
          transfer.transferId = `TRF-${String(count + 1).padStart(6, '0')}`;
        },
      },
    }
  );

  Transfer.associate = (models) => {
    Transfer.belongsTo(models.Location, { foreignKey: 'sourceLocationId', as: 'sourceLocation' });
    Transfer.belongsTo(models.Location, { foreignKey: 'destLocationId', as: 'destLocation' });
    Transfer.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
    Transfer.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
    Transfer.belongsTo(models.User, { foreignKey: 'updatedById', as: 'updatedBy' });
  };

  return Transfer;
};

