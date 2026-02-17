import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// Schema is stored as schema.json in the same directory as contexts.json.
// No external YAML parser dependency — JSON is equally readable and consistent
// with the rest of the store files.

export interface SchemaField {
  type: 'string' | 'string[]' | 'number' | 'boolean' | 'enum';
  required?: boolean;
  description?: string;
  values?: string[];   // for enum type
  default?: unknown;
}

export interface SchemaType {
  name: string;
  description: string;
  fields: Record<string, SchemaField>;
}

export interface Schema {
  version: number;
  types: SchemaType[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function getDefaultSchemaPath(): string {
  return join(homedir(), '.opencontext', 'schema.json');
}

export function loadSchema(schemaPath?: string): Schema | null {
  const filePath = schemaPath ?? getDefaultSchemaPath();
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Schema;
    // Normalize: ensure types array has name field from key
    return parsed;
  } catch {
    return null;
  }
}

export function saveSchema(schema: Schema, schemaPath?: string): void {
  const filePath = schemaPath ?? getDefaultSchemaPath();
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(schema, null, 2), 'utf-8');
}

export function getSchemaType(schema: Schema, typeName: string): SchemaType | undefined {
  return schema.types.find((t) => t.name === typeName);
}

export function validateEntry(
  schema: Schema,
  typeName: string,
  data: Record<string, unknown>,
): ValidationResult {
  const schemaType = getSchemaType(schema, typeName);
  if (!schemaType) {
    return { valid: false, errors: [`Unknown context type: "${typeName}"`] };
  }
  const errors: string[] = [];
  for (const [fieldName, fieldDef] of Object.entries(schemaType.fields)) {
    const value = data[fieldName];
    if (fieldDef.required && (value === undefined || value === null || value === '')) {
      errors.push(`Field "${fieldName}" is required`);
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    if (fieldDef.type === 'enum' && fieldDef.values) {
      if (!fieldDef.values.includes(value as string)) {
        errors.push(`Field "${fieldName}" must be one of: ${fieldDef.values.join(', ')}`);
      }
    } else if (fieldDef.type === 'string[]') {
      if (!Array.isArray(value)) {
        errors.push(`Field "${fieldName}" must be an array of strings`);
      }
    } else if (fieldDef.type === 'number') {
      if (typeof value !== 'number') {
        errors.push(`Field "${fieldName}" must be a number`);
      }
    } else if (fieldDef.type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors.push(`Field "${fieldName}" must be a boolean`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function describeSchema(schema: Schema): string {
  if (schema.types.length === 0) {
    return 'No context types defined in schema.';
  }
  const lines: string[] = [`Schema v${schema.version} — ${schema.types.length} type(s):\n`];
  for (const type of schema.types) {
    lines.push(`Type: ${type.name}`);
    lines.push(`  Description: ${type.description}`);
    const fieldEntries = Object.entries(type.fields);
    if (fieldEntries.length > 0) {
      lines.push('  Fields:');
      for (const [name, field] of fieldEntries) {
        const required = field.required ? ' (required)' : ' (optional)';
        const enumVals = field.type === 'enum' && field.values ? ` [${field.values.join('|')}]` : '';
        const desc = field.description ? ` — ${field.description}` : '';
        lines.push(`    - ${name}: ${field.type}${enumVals}${required}${desc}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function buildContentFromData(typeName: string, data: Record<string, unknown>): string {
  const parts = [`[${typeName}]`];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      const display = Array.isArray(value) ? value.join(', ') : String(value);
      parts.push(`${key}: ${display}`);
    }
  }
  return parts.join(' | ');
}
