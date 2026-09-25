const request = require('supertest');
const { sequelize, User, Location, Item, Inventory, CustomerOrder, Transfer } = require('../models');
const app = require('../server');

let testUser, testLocation, testItem, testInventory, token;

beforeAll(async () => {
  // Sync database
  await sequelize.sync({ force: true });

  // Create test user
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123',
    role: 'admin',
  });
  token = testUser.getSignedJwtToken();

  // Create test location
  testLocation = await Location.create({
    name: 'Test Location',
    code: 'TEST-001',
  });

  // Create test item
  testItem = await Item.create({
    name: 'Test Item',
    sku: 'TEST-SKU-001',
    category: 'Test',
  });

  // Create test inventory
  testInventory = await Inventory.create({
    itemId: testItem.id,
    locationId: testLocation.id,
    batch: 'DEFAULT',
    physicalQty: 100,
    reservedQty: 0,
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Inventory Management Tests', () => {
  describe('Test 1: Cannot reserve more than available inventory', () => {
    it('should prevent reservation exceeding available stock', async () => {
      const salesUser = await User.create({
        name: 'Sales Test',
        email: 'salestest@example.com',
        password: 'Sales@123',
        role: 'sales',
      });
      const salesToken = salesUser.getSignedJwtToken();

      // Create order with quantity > available
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerName: 'Test Customer',
          customerEmail: 'customer@test.com',
          customerPhone: '1234567890',
          itemId: testItem.id,
          locationId: testLocation.id,
          batch: 'DEFAULT',
          quantity: 150, // More than available (100)
          notes: 'Test order',
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.data.id;

      // Try to reserve - should fail
      const reserveRes = await request(app)
        .patch(`/api/orders/${orderId}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(reserveRes.status).toBe(400);
      expect(reserveRes.body.message).toContain('Insufficient available stock');
    });

    it('should successfully reserve when quantity available', async () => {
      const salesUser = await User.create({
        name: 'Sales Test 2',
        email: 'salestest2@example.com',
        password: 'Sales@123',
        role: 'sales',
      });
      const salesToken = salesUser.getSignedJwtToken();

      // Create order with quantity <= available
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerName: 'Test Customer 2',
          customerEmail: 'customer2@test.com',
          customerPhone: '9876543210',
          itemId: testItem.id,
          locationId: testLocation.id,
          batch: 'DEFAULT',
          quantity: 50, // Less than available (100)
          notes: 'Valid order',
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.data.id;

      // Reserve - should succeed
      const reserveRes = await request(app)
        .patch(`/api/orders/${orderId}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`);

      expect(reserveRes.status).toBe(200);
      expect(reserveRes.body.data.status).toBe('Reserved');

      // Verify inventory was updated
      const updatedInv = await Inventory.findOne({
        where: { itemId: testItem.id, locationId: testLocation.id, batch: 'DEFAULT' },
      });
      expect(updatedInv.reservedQty).toBe(50);
    });
  });

  describe('Test 2: Cannot transfer more than available inventory', () => {
    it('should prevent transfer exceeding available stock', async () => {
      const opsUser = await User.create({
        name: 'Ops Test',
        email: 'opstest@example.com',
        password: 'Ops@123',
        role: 'operations',
      });
      const opsToken = opsUser.getSignedJwtToken();

      // Create second location
      const loc2 = await Location.create({
        name: 'Test Location 2',
        code: 'TEST-002',
      });

      // Try to transfer more than available
      const transferRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          sourceLocationId: testLocation.id,
          destLocationId: loc2.id,
          itemId: testItem.id,
          batch: 'DEFAULT',
          quantity: 200, // More than available (50 after reservation)
          notes: 'Invalid transfer',
        });

      expect(transferRes.status).toBe(400);
      expect(transferRes.body.message).toContain('Insufficient available stock');
    });

    it('should successfully transfer when quantity available', async () => {
      const opsUser = await User.create({
        name: 'Ops Test 2',
        email: 'opstest2@example.com',
        password: 'Ops@123',
        role: 'operations',
      });
      const opsToken = opsUser.getSignedJwtToken();

      const loc3 = await Location.create({
        name: 'Test Location 3',
        code: 'TEST-003',
      });

      // Create fresh inventory with known quantity
      const freshInv = await Inventory.create({
        itemId: testItem.id,
        locationId: loc3.id,
        batch: 'DEFAULT',
        physicalQty: 100,
        reservedQty: 0,
      });

      const loc4 = await Location.create({
        name: 'Test Location 4',
        code: 'TEST-004',
      });

      // Transfer valid quantity
      const transferRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          sourceLocationId: loc3.id,
          destLocationId: loc4.id,
          itemId: testItem.id,
          batch: 'DEFAULT',
          quantity: 50,
          notes: 'Valid transfer',
        });

      expect(transferRes.status).toBe(201);
      expect(transferRes.body.data.status).toBe('Requested');
    });
  });

  describe('Test 3: Destination stock increases only after transfer receipt', () => {
    it('should not increase destination qty until received', async () => {
      const opsUser = await User.create({
        name: 'Ops Test 3',
        email: 'opstest3@example.com',
        password: 'Ops@123',
        role: 'operations',
      });
      const opsToken = opsUser.getSignedJwtToken();

      const locSrc = await Location.create({
        name: 'Source Loc',
        code: 'SRC-001',
      });

      const locDst = await Location.create({
        name: 'Dest Loc',
        code: 'DST-001',
      });

      // Create source inventory
      const srcInv = await Inventory.create({
        itemId: testItem.id,
        locationId: locSrc.id,
        batch: 'DEFAULT',
        physicalQty: 100,
        reservedQty: 0,
      });

      // Create transfer
      const transferRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          sourceLocationId: locSrc.id,
          destLocationId: locDst.id,
          itemId: testItem.id,
          batch: 'DEFAULT',
          quantity: 30,
          notes: 'Test staged transfer',
        });

      const transferId = transferRes.body.data.id;

      // Check destination before dispatch
      let dstInv = await Inventory.findOne({
        where: { itemId: testItem.id, locationId: locDst.id, batch: 'DEFAULT' },
      });
      expect(dstInv).toBeNull(); // Should not exist yet

      // Dispatch transfer
      const dispatchRes = await request(app)
        .patch(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(dispatchRes.status).toBe(200);

      // Check destination after dispatch - should still be empty
      dstInv = await Inventory.findOne({
        where: { itemId: testItem.id, locationId: locDst.id, batch: 'DEFAULT' },
      });
      expect(dstInv).toBeNull();

      // Receive transfer
      const receiveRes = await request(app)
        .patch(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(receiveRes.status).toBe(200);

      // Check destination after receipt - should now have qty
      dstInv = await Inventory.findOne({
        where: { itemId: testItem.id, locationId: locDst.id, batch: 'DEFAULT' },
      });
      expect(dstInv).not.toBeNull();
      expect(dstInv.physicalQty).toBe(30);
    });
  });

  describe('Test 4: Same transfer cannot be received twice', () => {
    it('should prevent duplicate receipt of same transfer', async () => {
      const opsUser = await User.create({
        name: 'Ops Test 4',
        email: 'opstest4@example.com',
        password: 'Ops@123',
        role: 'operations',
      });
      const opsToken = opsUser.getSignedJwtToken();

      const locSrc2 = await Location.create({
        name: 'Source Loc 2',
        code: 'SRC-002',
      });

      const locDst2 = await Location.create({
        name: 'Dest Loc 2',
        code: 'DST-002',
      });

      // Create source inventory
      await Inventory.create({
        itemId: testItem.id,
        locationId: locSrc2.id,
        batch: 'DEFAULT',
        physicalQty: 100,
        reservedQty: 0,
      });

      // Create and dispatch transfer
      const transferRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          sourceLocationId: locSrc2.id,
          destLocationId: locDst2.id,
          itemId: testItem.id,
          batch: 'DEFAULT',
          quantity: 25,
          notes: 'Transfer for double-receipt test',
        });

      const transferId = transferRes.body.data.id;

      await request(app)
        .patch(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${opsToken}`);

      // First receipt - should succeed
      const receipt1 = await request(app)
        .patch(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(receipt1.status).toBe(200);
      expect(receipt1.body.data.status).toBe('Received');

      // Second receipt - should fail
      const receipt2 = await request(app)
        .patch(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(receipt2.status).toBe(400);
      expect(receipt2.body.message).toContain('already been received');
    });
  });

  describe('Test 5: Unauthorized user cannot perform restricted operation', () => {
    it('should prevent sales user from creating transfer', async () => {
      const salesUser = await User.create({
        name: 'Sales Unauth',
        email: 'salesunauth@example.com',
        password: 'Sales@123',
        role: 'sales',
      });
      const salesToken = salesUser.getSignedJwtToken();

      const locA = await Location.create({
        name: 'Loc A',
        code: 'LOC-A',
      });

      const locB = await Location.create({
        name: 'Loc B',
        code: 'LOC-B',
      });

      // Sales user tries to create transfer
      const transferRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          sourceLocationId: locA.id,
          destLocationId: locB.id,
          itemId: testItem.id,
          batch: 'DEFAULT',
          quantity: 10,
          notes: 'Unauthorized transfer',
        });

      expect(transferRes.status).toBe(403);
      expect(transferRes.body.message).toContain('not authorized');
    });

    it('should prevent operations user from creating work order', async () => {
      const opsUser = await User.create({
        name: 'Ops Unauth',
        email: 'opsunauth@example.com',
        password: 'Ops@123',
        role: 'operations',
      });
      const opsToken = opsUser.getSignedJwtToken();

      // Operations user tries to create work order (admin only)
      const woRes = await request(app)
        .post('/api/workorders')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          locationId: testLocation.id,
          itemId: testItem.id,
          requiredQty: 50,
          assignedUserId: opsUser.id,
          notes: 'Unauthorized WO',
        });

      expect(woRes.status).toBe(403);
      expect(woRes.body.message).toContain('not authorized');
    });

    it('should allow anonymous request to fail gracefully', async () => {
      const invRes = await request(app).get('/api/inventory');

      expect(invRes.status).toBe(401);
      expect(invRes.body.message).toContain('no token provided');
    });
  });
});
