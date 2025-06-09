import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.env.DATA_DIRECTORY || './data', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get branding settings
router.get('/', async (req, res) => {
  try {
    const branding = await db
      .selectFrom('branding_settings')
      .selectAll()
      .executeTakeFirst();

    if (!branding) {
      // Return default branding
      res.json({
        id: 0,
        logo_filename: null,
        logo_path: null,
        company_name: 'Network Manager',
        company_description: 'Network Infrastructure Management System',
        primary_color: '#000000',
        secondary_color: '#ffffff'
      });
      return;
    }

    res.json(branding);
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({ error: 'Failed to get branding settings' });
  }
});

// Update branding settings
router.put('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { company_name, company_description, primary_color, secondary_color } = req.body;

    const existing = await db
      .selectFrom('branding_settings')
      .selectAll()
      .executeTakeFirst();

    if (existing) {
      const updated = await db
        .updateTable('branding_settings')
        .set({
          company_name,
          company_description,
          primary_color,
          secondary_color,
          updated_at: new Date().toISOString()
        })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirst();

      res.json(updated);
    } else {
      const created = await db
        .insertInto('branding_settings')
        .values({
          company_name,
          company_description,
          primary_color,
          secondary_color,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returningAll()
        .executeTakeFirst();

      res.json(created);
    }
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({ error: 'Failed to update branding settings' });
  }
});

// Upload logo
router.post('/logo', requireAuth, requireRole('admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const logoPath = `/uploads/${req.file.filename}`;
    
    const existing = await db
      .selectFrom('branding_settings')
      .selectAll()
      .executeTakeFirst();

    if (existing) {
      // Delete old logo file if exists
      if (existing.logo_filename) {
        const oldLogoPath = path.join(process.env.DATA_DIRECTORY || './data', 'uploads', existing.logo_filename);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      const updated = await db
        .updateTable('branding_settings')
        .set({
          logo_filename: req.file.filename,
          logo_path: logoPath,
          updated_at: new Date().toISOString()
        })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirst();

      res.json(updated);
    } else {
      const created = await db
        .insertInto('branding_settings')
        .values({
          logo_filename: req.file.filename,
          logo_path: logoPath,
          company_name: 'Network Manager',
          company_description: 'Network Infrastructure Management System',
          primary_color: '#000000',
          secondary_color: '#ffffff',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .returningAll()
        .executeTakeFirst();

      res.json(created);
    }
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Delete logo
router.delete('/logo', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const existing = await db
      .selectFrom('branding_settings')
      .selectAll()
      .executeTakeFirst();

    if (!existing || !existing.logo_filename) {
      res.status(404).json({ error: 'No logo found' });
      return;
    }

    // Delete logo file
    const logoPath = path.join(process.env.DATA_DIRECTORY || './data', 'uploads', existing.logo_filename);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    const updated = await db
      .updateTable('branding_settings')
      .set({
        logo_filename: null,
        logo_path: null,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirst();

    res.json(updated);
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
});

export default router;
