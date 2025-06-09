import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all notes
router.get('/', requireAuth, async (req, res) => {
  try {
    const notes = await db
      .selectFrom('notes')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Add note
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, priority, due_date } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const note = await db
      .insertInto('notes')
      .values({
        title,
        content,
        priority: priority || 'medium',
        due_date: due_date || null,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returningAll()
      .executeTakeFirst();

    res.status(201).json(note);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Update note
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, completed, due_date } = req.body;

    const note = await db
      .updateTable('notes')
      .set({
        title,
        content,
        priority,
        completed: completed || false,
        due_date,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .deleteFrom('notes')
      .where('id', '=', parseInt(id))
      .execute();

    if (result.length === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Toggle note completion
router.patch('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const currentNote = await db
      .selectFrom('notes')
      .selectAll()
      .where('id', '=', parseInt(id))
      .executeTakeFirst();

    if (!currentNote) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const note = await db
      .updateTable('notes')
      .set({
        completed: !currentNote.completed,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', parseInt(id))
      .returningAll()
      .executeTakeFirst();

    res.json(note);
  } catch (error) {
    console.error('Toggle note error:', error);
    res.status(500).json({ error: 'Failed to toggle note' });
  }
});

export default router;
