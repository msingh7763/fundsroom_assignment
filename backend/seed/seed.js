require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, User, Location, Item, Inventory } = require('../models');

const seed = async () => {
  try {
    console.log('🌱 Starting PostgreSQL seed...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Sync models (create tables if needed)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');

    // Clear existing data (cascade to respect FK constraints)
    await sequelize.query('TRUNCATE TABLE "CustomerOrders", "Transfers", "WorkOrders", "Inventories", "Items", "Locations", "Users" RESTART IDENTITY CASCADE');
    console.log('✅ Cleared existing data');

    // ─── Users ───────────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@fundsroom.com',
      password: 'Admin@123',
      role: 'admin',
    });
    const ops = await User.create({
      name: 'Operations Manager',
      email: 'ops@fundsroom.com',
      password: 'Ops@123',
      role: 'operations',
    });
    const sales = await User.create({
      name: 'Sales Executive',
      email: 'sales@fundsroom.com',
      password: 'Sales@123',
      role: 'sales',
    });
    console.log('✅ Created users');
    console.log('   admin@fundsroom.com    / Admin@123   (role: admin)');
    console.log('   ops@fundsroom.com      / Ops@123     (role: operations)');
    console.log('   sales@fundsroom.com    / Sales@123   (role: sales)');

    // ─── Locations ───────────────────────────────────────────────────────────
    const warehouseA = await Location.create({
      name: 'Warehouse A',
      code: 'WH-A',
      description: 'Main warehouse - north wing',
    });
    const warehouseB = await Location.create({
      name: 'Warehouse B',
      code: 'WH-B',
      description: 'Secondary warehouse - south wing',
    });
    const storeC = await Location.create({
      name: 'Store C',
      code: 'ST-C',
      description: 'Retail store front',
    });
    console.log('✅ Created locations: Warehouse A, Warehouse B, Store C');

    // ─── Items ───────────────────────────────────────────────────────────────
    const itemLaptop = await Item.create({
      name: 'Laptop Pro 15',
      sku: 'LPTP-PRO-15',
      category: 'Electronics',
      unit: 'pcs',
      description: '15-inch professional laptop',
      minStockLevel: 5,
    });
    const itemMouse = await Item.create({
      name: 'Wireless Mouse',
      sku: 'MOUS-WL-01',
      category: 'Electronics',
      unit: 'pcs',
      description: 'Ergonomic wireless mouse',
      minStockLevel: 10,
    });
    const itemDesk = await Item.create({
      name: 'Standing Desk',
      sku: 'DESK-STD-01',
      category: 'Furniture',
      unit: 'pcs',
      description: 'Height-adjustable standing desk',
      minStockLevel: 2,
    });
    console.log('✅ Created items: Laptop Pro 15, Wireless Mouse, Standing Desk');

    // ─── Inventory ───────────────────────────────────────────────────────────
    await Inventory.bulkCreate([
      { itemId: itemLaptop.id, locationId: warehouseA.id, batch: 'DEFAULT', physicalQty: 50, reservedQty: 10 },
      { itemId: itemLaptop.id, locationId: warehouseB.id, batch: 'DEFAULT', physicalQty: 20, reservedQty: 0 },
      { itemId: itemMouse.id,  locationId: warehouseA.id, batch: 'DEFAULT', physicalQty: 200, reservedQty: 25 },
      { itemId: itemMouse.id,  locationId: storeC.id,     batch: 'DEFAULT', physicalQty: 30, reservedQty: 5 },
      { itemId: itemDesk.id,   locationId: warehouseB.id, batch: 'DEFAULT', physicalQty: 15, reservedQty: 2 },
    ]);
    console.log('✅ Created inventory records');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('─'.repeat(50));
    console.log('API Base URL : http://localhost:5000/api');
    console.log('Login URL    : POST /api/auth/login');
    console.log('─'.repeat(50));
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seed();
