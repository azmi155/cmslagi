import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all service packages
router.get('/', requireAuth, async (req, res) => {
  try {
    const packages = await db
      .selectFrom('service_packages')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    // Convert integer values back to booleans for API response
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      is_active: Boolean(pkg.is_active)
    }));

    res.json(formattedPackages);
  } catch (error) {
    console.error('Get service packages error:', error);
    res.status(500).json({ error: 'Failed to get service packages' });
  }
});

// Get active service packages only
router.get('/active', requireAuth, async (req, res) => {
  try {
    const packages = await db
      .selectFrom('service_packages')
      .selectAll()
      .where('is_active', '=', 1)
      .orderBy('price', 'asc')
      .execute();

    // Convert integer values back to booleans for API response
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      is_active: Boolean(pkg.is_active)
    }));

    res.json(formattedPackages);
  } catch (error) {
    console.error('Get active service packages error:', error);
    res.status(500).json({ error: 'Failed to get active service packages' });
  }
});

// Add service package
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, price, bandwidth_up, bandwidth_down, duration_days } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ error: 'Name and price are required' });
      return;
    }

    const servicePackage = await db
      .insertInto('service_packages')
      .values({
        name,
        description,
        price: Number(price),
        bandwidth_up,
        bandwidth_down,
        duration_days: duration_days || 30,
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    if (servicePackage) {
      const formattedPackage = {
        ...servicePackage,
        is_active: Boolean(servicePackage.is_active)
      };
      res.status(201).json(formattedPackage);
    }
  } catch (error) {
    console.error('Add service package error:', error);
    res.status(500).json({ error: 'Failed to add service package' });
  }
});

// Update service package
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, bandwidth_up, bandwidth_down, duration_days, is_active } = req.body;

    const servicePackage = await db
      .updateTable('service_packages')
      .set({
        name,
        description,
        price: Number(price),
        bandwidth_up,
        bandwidth_down,
        duration_days: duration_days || 30,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!servicePackage) {
      res.status(404).json({ error: 'Service package not found' });
      return;
    }

    const formattedPackage = {
      ...servicePackage,
      is_active: Boolean(servicePackage.is_active)
    };

    res.json(formattedPackage);
  } catch (error) {
    console.error('Update service package error:', error);
    res.status(500).json({ error: 'Failed to update service package' });
  }
});

// Delete service package
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('service_packages')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'Service package not found' });
      return;
    }

    res.json({ message: 'Service package deleted successfully' });
  } catch (error) {
    console.error('Delete service package error:', error);
    res.status(500).json({ error: 'Failed to delete service package' });
  }
});

export default router;
