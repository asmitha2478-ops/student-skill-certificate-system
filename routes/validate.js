// Server-side input validation, driven by the field definitions in entities.js.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9]{10,15}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * @param entity  entity definition from entities.js
 * @param body    request body
 * @param mode    'create' | 'update'
 * @returns { errors: string[], values: object }
 */
function validate(entity, body, mode) {
  const errors = [];
  const values = {};
  const input = body && typeof body === 'object' ? body : {};

  for (const f of entity.fields) {
    if (f.auto) continue; // auto-increment ids are never supplied
    if (mode === 'update' && entity.pk.includes(f.name)) continue; // keys cannot change

    let v = input[f.name];
    if (typeof v === 'string') v = v.trim();

    if (v === undefined || v === null || v === '') {
      if (f.required) errors.push(`${f.label} is required.`);
      values[f.name] = null;
      continue;
    }

    switch (f.type) {
      case 'int':
      case 'fk': {
        if (!/^-?\d+$/.test(String(v))) {
          errors.push(`${f.label} must be a whole number.`);
          break;
        }
        const n = Number(v);
        const min = f.min !== undefined ? f.min : f.type === 'fk' ? 1 : undefined;
        if (min !== undefined && n < min) errors.push(`${f.label} must be at least ${min}.`);
        else if (f.max !== undefined && n > f.max) errors.push(`${f.label} must be at most ${f.max}.`);
        else values[f.name] = n;
        break;
      }
      case 'email':
        if (String(v).length > f.max) errors.push(`${f.label} must be at most ${f.max} characters.`);
        else if (!EMAIL_RE.test(v)) errors.push(`${f.label} must be a valid email address.`);
        else values[f.name] = String(v).toLowerCase();
        break;
      case 'phone':
        if (!PHONE_RE.test(String(v))) errors.push(`${f.label} must be 10 to 15 digits, with an optional leading +.`);
        else values[f.name] = String(v);
        break;
      case 'date':
        if (!isRealDate(String(v))) errors.push(`${f.label} must be a valid date (YYYY-MM-DD).`);
        else values[f.name] = String(v);
        break;
      case 'enum':
        if (!f.options.includes(v)) errors.push(`${f.label} must be one of: ${f.options.join(', ')}.`);
        else values[f.name] = v;
        break;
      default: // text
        if (typeof v !== 'string' && typeof v !== 'number') errors.push(`${f.label} must be text.`);
        else if (String(v).length > f.max) errors.push(`${f.label} must be at most ${f.max} characters.`);
        else values[f.name] = String(v);
    }
  }

  if (!errors.length && typeof entity.check === 'function') {
    const message = entity.check(values);
    if (message) errors.push(message);
  }
  return { errors, values };
}

module.exports = { validate, isRealDate };
