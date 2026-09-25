module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define(
    'WorkOrder',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      workOrderId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        defaultValue: 'PENDING',
      },
      locationId: {
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
      requiredQty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      availableQtyAtCreation: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      shortageQty: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      assignedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('Assigned', 'InProgress', 'Completed'),
        defaultValue: 'Assigned',
      },
      notes: DataTypes.TEXT,
      createdById: {
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
        beforeCreate: async (workorder) => {
          const count = await WorkOrder.count().catch(() => 0);
          workorder.workOrderId = `WO-${String(count + 1).padStart(6, '0')}`;
        },
      },
    }
  );

  WorkOrder.associate = (models) => {
    WorkOrder.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    WorkOrder.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
    WorkOrder.belongsTo(models.User, { foreignKey: 'assignedUserId', as: 'assignedUser' });
    WorkOrder.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
  };

  return WorkOrder;
};

