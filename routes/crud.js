// Generic REST API for every entity defined in entities.js
//   GET    /api/meta
//   GET    /api/stats
//   GET    /api/lookup/:entity
//   GET    /api/:entity?q=search
//   GET    /api/:entity/:k1[/:k2]
//   POST   /api/:entity
//   PUT    /api/:entity/:k1[/:k2]
//   DELETE /api/:entity/:k1[/:k2]
const express = require('express');
const pool = require('../db/pool');
const entities = require('./entities');
const { validate } = require('./validate');
const { HttpError, asyncHandler } = require('./errors');

const router = express.Router();
const q = (name) => `\`${name}\``;

function getEntity(name) {
  if (!Object.prototype.hasOwnProperty.call(entities, name)) {
    throw new HttpError(404, 'Unknown resource.');
  }
  return entities[name];
}

function keyValues(e, params) {
  const raw = e.pk.map((_, i) => params[`k${i + 1}`]);
  if (params[`k${e.pk.length + 1}`] !== undefined) throw new HttpError(404, 'Unknown resource.');
  if (raw.some((v) => v === undefined || !/^\d+$/.test(v))) {
    throw new HttpError(400, 'The record key in the URL is not valid.');
  }
  return raw.map(Number);
}

const whereKey = (e) => e.pk.map((c) => `t.${q(c)} = ?`).join(' AND ');

async function findOne(e, keys) {
  const [rows] = await pool.query(`${e.select} WHERE ${whereKey(e)}`, keys);
  return rows[0];
}

router.get('/meta', (req, res) => {
  res.json(
    Object.entries(entities).map(([key, e]) => ({
      key,
      label: e.label,
      singular: e.singular,
      pk: e.pk,
      columns: e.columns,
      fields: e.fields,
    }))
  );
});

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const out = {};
    for (const [key, e] of Object.entries(entities)) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${q(e.table)}`);
      out[key] = rows[0].n;
    }
    res.json(out);
  })
);

router.get(
  '/lookup/:entity',
  asyncHandler(async (req, res) => {
    const e = getEntity(req.params.entity);
    if (!e.lookup) throw new HttpError(404, 'Unknown resource.');
    const [rows] = await pool.query(e.lookup);
    res.json(rows);
  })
);

// List + search
router.get(
  '/:entity',
  asyncHandler(async (req, res) => {
    const e = getEntity(req.params.entity);
    const term = String(req.query.q || '').trim().slice(0, 100);
    let sql = e.select;
    const params = [];
    if (term) {
      const escaped = term.replace(/[\\%_]/g, '\\$&');
      sql += ` WHERE ${e.search.map((c) => `${c} LIKE ?`).join(' OR ')}`;
      e.search.forEach(() => params.push(`%${escaped}%`));
    }
    sql += ` ORDER BY ${e.order}`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  })
);

// Read one
router.get(
  '/:entity/:k1/:k2?',
  asyncHandler(async (req, res) => {
    const e = getEntity(req.params.entity);
    const row = await findOne(e, keyValues(e, req.params));
    if (!row) throw new HttpError(404, `${e.singular} not found.`);
    res.json(row);
  })
);

// Create
router.post(
  '/:entity',
  asyncHandler(async (req, res) => {
    const e = getEntity(req.params.entity);
    const { errors, values } = validate(e, req.body, 'create');
    if (errors.length) throw new HttpError(400, 'Please fix the following:', errors);

    const cols = Object.keys(values);
    const [result] = await pool.query(
      `INSERT INTO ${q(e.table)} (${cols.map(q).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((c) => values[c])
    );
    res.status(201).json({ message: `${e.singular} added.`, id: result.insertId || null });
  })
);

// Update
router.put(
  '/:entity/:k1/:k2?',
  asyncHandler(async (req, res) => {
    const e = getEntity(req.params.entity);
    const keys = keyValues(e, req.params);
    const { errors, values } = validate(e, req.body, 'update');
    if (errors.length) throw new HttpError(400, 'Please fix the following:', errors);
    if (!(await findOne(e, keys))) throw new HttpError(404, `${e.singular} not found.`);

    const cols = Object.keys(values);
    await pool.query(
      `UPDATE ${q(e.table)} t SET ${cols.map((c) => `t.${q(c)} = ?`).join(', ')} WHERE ${whereKey(e)}`,
      [...cols.map((c) => values[c]), ...keys]
    );
    res.json({ message: `${e.singular} updated.` });
  })
);

// Delete
router.delete(
  '/:entity/:k1/:k2?',
  asyncHandler(async (req, res) => {
    const e = getEntity(req.params.entity);
    const keys = keyValues(e, req.params);
    const [result] = await pool.query(
      `DELETE t FROM ${q(e.table)} t WHERE ${whereKey(e)}`,
      keys
    );
    if (result.affectedRows === 0) throw new HttpError(404, `${e.singular} not found.`);
    res.json({ message: `${e.singular} deleted.` });
  })
);

module.exports = router;
