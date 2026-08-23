import fs from 'node:fs';
import path from 'node:path';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const sameValue = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const rfc3339DateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))$/;

function isRfc3339DateTime(value) {
  const match = rfc3339DateTime.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 60) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return false;
  if (match[8] !== 'Z') {
    const offsetHour = Number(match[10]);
    const offsetMinute = Number(match[11]);
    if (offsetHour > 23 || offsetMinute > 59) return false;
  }
  return true;
}

function typeMatches(value, expected) {
  switch (expected) {
    case 'null': return value === null;
    case 'array': return Array.isArray(value);
    case 'object': return isObject(value);
    case 'integer': return Number.isInteger(value);
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    default: return true;
  }
}

function resolvePointer(document, fragment) {
  if (!fragment || fragment === '#') return document;
  if (!fragment.startsWith('#/')) throw new Error(`Unsupported JSON Schema fragment: ${fragment}`);
  return fragment
    .slice(2)
    .split('/')
    .map((part) => decodeURIComponent(part).replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((value, part) => value?.[part], document);
}

export function loadSchemaRegistry(repositoryRoot) {
  const schemas = [];
  for (const relativeDirectory of ['schemas/domain', 'schemas/runtime']) {
    const directory = path.join(repositoryRoot, relativeDirectory);
    for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith('.json')).sort()) {
      const filePath = path.join(directory, name);
      const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!schema.$id) throw new Error(`${filePath} has no $id`);
      schemas.push({ filePath, schema });
    }
  }

  const byId = new Map(schemas.map(({ schema }) => [schema.$id, schema]));
  if (byId.size !== schemas.length) throw new Error('Schema $id values must be unique.');
  return { schemas, byId };
}

export function resolveSchemaRef(ref, baseId, registry) {
  const resolvedUrl = new URL(ref, baseId);
  const documentId = `${resolvedUrl.origin}${resolvedUrl.pathname}${resolvedUrl.search}`;
  const document = registry.byId.get(documentId);
  if (!document) throw new Error(`Unresolved schema reference ${ref} from ${baseId} (${documentId})`);
  const target = resolvePointer(document, resolvedUrl.hash);
  if (target === undefined) throw new Error(`Unresolved JSON Pointer ${resolvedUrl.hash} in ${documentId}`);
  return { schema: target, baseId: document.$id };
}

export function assertAllSchemaRefsResolve(registry) {
  function visit(value, baseId) {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, baseId);
      return;
    }
    if (!isObject(value)) return;
    const nextBase = typeof value.$id === 'string' ? new URL(value.$id, baseId).href : baseId;
    if (typeof value.$ref === 'string') resolveSchemaRef(value.$ref, nextBase, registry);
    for (const child of Object.values(value)) visit(child, nextBase);
  }

  for (const { schema } of registry.schemas) visit(schema, schema.$id);
}

export function validateJsonSchema(instance, rootSchema, registry) {
  const errors = [];

  function check(value, schema, instancePath, baseId, localErrors) {
    if (schema === true) return;
    if (schema === false) {
      localErrors.push(`${instancePath}: rejected by false schema`);
      return;
    }

    const currentBase = typeof schema.$id === 'string' ? new URL(schema.$id, baseId).href : baseId;

    if (typeof schema.$ref === 'string') {
      const resolved = resolveSchemaRef(schema.$ref, currentBase, registry);
      check(value, resolved.schema, instancePath, resolved.baseId, localErrors);
    }

    if (schema.allOf) {
      for (const branch of schema.allOf) check(value, branch, instancePath, currentBase, localErrors);
    }
    if (schema.anyOf) {
      const validBranches = schema.anyOf.filter((branch) => {
        const branchErrors = [];
        check(value, branch, instancePath, currentBase, branchErrors);
        return branchErrors.length === 0;
      });
      if (validBranches.length === 0) localErrors.push(`${instancePath}: does not match anyOf`);
    }
    if (schema.oneOf) {
      const validBranches = schema.oneOf.filter((branch) => {
        const branchErrors = [];
        check(value, branch, instancePath, currentBase, branchErrors);
        return branchErrors.length === 0;
      });
      if (validBranches.length !== 1) localErrors.push(`${instancePath}: matches ${validBranches.length} oneOf branches`);
    }
    if (schema.not) {
      const branchErrors = [];
      check(value, schema.not, instancePath, currentBase, branchErrors);
      if (branchErrors.length === 0) localErrors.push(`${instancePath}: matches prohibited schema`);
    }
    if (schema.if) {
      const conditionErrors = [];
      check(value, schema.if, instancePath, currentBase, conditionErrors);
      if (conditionErrors.length === 0 && schema.then) {
        check(value, schema.then, instancePath, currentBase, localErrors);
      } else if (conditionErrors.length > 0 && schema.else) {
        check(value, schema.else, instancePath, currentBase, localErrors);
      }
    }

    if (schema.const !== undefined && !sameValue(value, schema.const)) {
      localErrors.push(`${instancePath}: expected const ${JSON.stringify(schema.const)}`);
    }
    if (schema.enum && !schema.enum.some((candidate) => sameValue(value, candidate))) {
      localErrors.push(`${instancePath}: value ${JSON.stringify(value)} is not in enum`);
    }

    if (schema.type) {
      const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!expectedTypes.some((type) => typeMatches(value, type))) {
        localErrors.push(`${instancePath}: expected type ${expectedTypes.join('|')}`);
        return;
      }
    }

    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        localErrors.push(`${instancePath}: shorter than minLength ${schema.minLength}`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        localErrors.push(`${instancePath}: longer than maxLength ${schema.maxLength}`);
      }
      if (schema.pattern && !(new RegExp(schema.pattern).test(value))) {
        localErrors.push(`${instancePath}: does not match ${schema.pattern}`);
      }
      if (schema.format === 'date-time' && !isRfc3339DateTime(value)) {
        localErrors.push(`${instancePath}: is not an RFC 3339 date-time`);
      }
    }

    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        localErrors.push(`${instancePath}: less than minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        localErrors.push(`${instancePath}: greater than maximum ${schema.maximum}`);
      }
    }

    if (Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        localErrors.push(`${instancePath}: fewer than ${schema.minItems} items`);
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        localErrors.push(`${instancePath}: more than ${schema.maxItems} items`);
      }
      if (schema.uniqueItems) {
        const serialized = value.map((item) => JSON.stringify(item));
        if (new Set(serialized).size !== serialized.length) {
          localErrors.push(`${instancePath}: items are not unique`);
        }
      }
      if (schema.items) {
        value.forEach((item, index) => check(item, schema.items, `${instancePath}/${index}`, currentBase, localErrors));
      }
    }

    if (isObject(value)) {
      if (schema.required) {
        for (const name of schema.required) {
          if (!Object.hasOwn(value, name)) localErrors.push(`${instancePath}: missing required property ${name}`);
        }
      }

      const declared = schema.properties ?? {};
      for (const [name, propertySchema] of Object.entries(declared)) {
        if (Object.hasOwn(value, name)) {
          check(value[name], propertySchema, `${instancePath}/${name}`, currentBase, localErrors);
        }
      }

      const extraNames = Object.keys(value).filter((name) => !Object.hasOwn(declared, name));
      if (schema.additionalProperties === false) {
        for (const name of extraNames) localErrors.push(`${instancePath}: unexpected property ${name}`);
      } else if (isObject(schema.additionalProperties) || typeof schema.additionalProperties === 'boolean') {
        for (const name of extraNames) {
          check(value[name], schema.additionalProperties, `${instancePath}/${name}`, currentBase, localErrors);
        }
      }
    }
  }

  check(instance, rootSchema, '#', rootSchema.$id, errors);
  return errors;
}
