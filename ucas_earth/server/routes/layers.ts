import { Router } from 'express';
import pool from '../db.js';
import { extractGroupName } from '../utils/grouping.js';

const router = Router();

// GET /api/geojson-layers - List all layers (metadata only)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id, l.name, l.group_id, l.file_size, l.feature_count, l.created_at,
             g.name as group_name
      FROM geojson_layers l
      LEFT JOIN geojson_groups g ON l.group_id = g.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to list layers:', err);
    res.status(500).json({ error: 'Failed to list layers' });
  }
});

// GET /api/geojson-layers/:id - Get single layer with full geojson
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM geojson_layers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to get layer:', err);
    res.status(500).json({ error: 'Failed to get layer' });
  }
});

// POST /api/geojson-layers - Create new layer (auto-creates group)
router.post('/', async (req, res) => {
  const { name, geojson } = req.body;
  if (!name || !geojson) {
    return res.status(400).json({ error: 'name and geojson are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Auto-create or get group
    const groupName = extractGroupName(name);
    const groupResult = await client.query(
      `INSERT INTO geojson_groups (name, display_name)
       VALUES ($1, $1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [groupName]
    );
    const groupId = groupResult.rows[0].id;

    // Calculate metadata
    const geojsonStr = JSON.stringify(geojson);
    const fileSize = Buffer.byteLength(geojsonStr, 'utf8');
    const featureCount = Array.isArray(geojson.features) ? geojson.features.length : 0;

    // Insert layer
    const layerResult = await client.query(
      `INSERT INTO geojson_layers (name, group_id, geojson, file_size, feature_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, group_id, file_size, feature_count, created_at`,
      [name, groupId, geojson, fileSize, featureCount]
    );

    await client.query('COMMIT');
    res.status(201).json(layerResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to create layer:', err);
    res.status(500).json({ error: 'Failed to create layer' });
  } finally {
    client.release();
  }
});

// DELETE /api/geojson-layers/:id - Delete a layer
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM geojson_layers WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete layer:', err);
    res.status(500).json({ error: 'Failed to delete layer' });
  }
});

export default router;
