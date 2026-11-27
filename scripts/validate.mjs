// Validates index.json, each plugin type's folder (plugins/*.json for provider plugins) and
// examples/*.json against the schemas in schema/ and the catalog rules in README.md.
// Usage: npm run validate
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLUGIN_MAX_BYTES = 256 * 1024
const OFFICIAL_AUTHOR = 'Cairn'

const errors = []
const fail = (file, message) => errors.push(`${file}: ${message}`)

function readJson(path) {
  const text = readFileSync(path, 'utf8')
  return { json: JSON.parse(text.replace(/^\uFEFF/, '')), bytes: Buffer.byteLength(text) }
}

const ajv = new Ajv2020({ allErrors: true, strict: true })
const compile = (schemaPath) => ajv.compile(readJson(join(root, schemaPath)).json)
const validateIndex = compile('schema/index.schema.json')

function schemaErrors(file, validate, data) {
  if (validate(data)) return true
  for (const e of validate.errors) fail(file, `${e.instancePath || '/'} ${e.message}`)
  return false
}

/** Rules the schema can't express: the same refinements as Cairn's zod schema, plus catalog policy. */
function checkProviderPlugin(file, plugin) {
  const providerIds = new Set()
  for (const [i, p] of plugin.providers.entries()) {
    const at = `/providers/${i}`
    if (providerIds.has(p.id)) fail(file, `${at}/id duplicate provider id "${p.id}"`)
    providerIds.add(p.id)
    if (p.regions) {
      const regionIds = p.regions.map((r) => r.id)
      if (new Set(regionIds).size !== regionIds.length) fail(file, `${at}/regions duplicate region id`)
      if (!p.regions.some((r) => r.baseUrl === p.baseUrl)) {
        fail(file, `${at}/baseUrl must be one of the regions' baseUrl`)
      }
    }
    const local = p.category === 'local'
    for (const url of [p.baseUrl, ...(p.regions ?? []).map((r) => r.baseUrl)]) {
      if (!local && !url.startsWith('https://')) fail(file, `${at} hosted services must use https (${url})`)
    }
    if (p.requiresKey === false && !local) fail(file, `${at}/requiresKey only local services may be keyless`)
  }
}

/**
 * The plugin types this catalog lists. Each type keeps its files in its own folder, named
 * `<dir>/<id>.json`, and has its own schema and checks. Add a type here when its folder is added.
 */
const TYPES = {
  provider: {
    dir: 'plugins',
    validate: compile('schema/provider-plugin.schema.json'),
    check: checkProviderPlugin,
  },
}
const typeNames = Object.keys(TYPES).join(', ')

/** Fields every plugin in this catalog must have, whatever its type. */
function checkCatalogFields(file, plugin, type) {
  for (const field of ['type', 'version', 'source', 'author']) {
    if (plugin[field] === undefined) fail(file, `/${field} is required in this catalog`)
  }
  if (plugin.type !== undefined && plugin.type !== type) {
    fail(file, `/type must be "${type}" for files in ${TYPES[type].dir}/`)
  }
  if (plugin.source === 'official' && plugin.author !== OFFICIAL_AUTHOR) {
    fail(file, `/author official plugins must use "${OFFICIAL_AUTHOR}"`)
  }
  if (plugin.source === 'third-party' && plugin.author?.trim().toLowerCase() === OFFICIAL_AUTHOR.toLowerCase()) {
    fail(file, `/author third-party plugins must name their own author, not "${OFFICIAL_AUTHOR}"`)
  }
}

/** Loads and checks a plugin file. `type` comes from its folder, or from the file itself for examples. */
function loadPlugin(path, type) {
  const file = relative(root, path)
  let parsed
  try {
    parsed = readJson(path)
  } catch (e) {
    fail(file, `not valid JSON: ${e.message}`)
    return undefined
  }
  if (parsed.bytes > PLUGIN_MAX_BYTES) fail(file, `larger than ${PLUGIN_MAX_BYTES} bytes`)
  const plugin = parsed.json
  type ??= plugin?.type
  const spec = Object.hasOwn(TYPES, type) ? TYPES[type] : undefined
  if (!spec) {
    fail(file, `/type must be one of: ${typeNames}`)
    return undefined
  }
  if (!schemaErrors(file, spec.validate, plugin)) return undefined
  checkCatalogFields(file, plugin, type)
  spec.check(file, plugin)
  return plugin
}

const jsonFiles = (dir) =>
  readdirSync(join(root, dir))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => join(root, dir, name))

const isFile = (path) => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

const index = readJson(join(root, 'index.json')).json
if (schemaErrors('index.json', validateIndex, index)) {
  const ids = index.plugins.map((entry) => entry.id)
  if (new Set(ids).size !== ids.length) fail('index.json', 'duplicate plugin id')
  if (ids.join('\n') !== [...ids].sort().join('\n')) fail('index.json', 'plugins must be sorted by id')

  const listed = new Set()
  for (const [i, entry] of index.plugins.entries()) {
    const at = `index.json /plugins/${i}`
    if (!Object.hasOwn(TYPES, entry.type)) {
      fail(at, `type "${entry.type}" is not listed by this catalog yet (known: ${typeNames})`)
      continue
    }
    const { dir } = TYPES[entry.type]
    if (entry.url.startsWith('https://')) {
      fail(at, `plugins in this catalog must be files in ${dir}/ (use a relative url)`)
      continue
    }
    if (entry.icon && !entry.icon.startsWith('https://') && !isFile(join(root, entry.icon))) {
      fail(at, `icon file not found: ${entry.icon}`)
    }
    const path = join(root, entry.url)
    if (relative(root, dirname(path)) !== dir || !isFile(path)) {
      fail(at, `url must point at an existing file in ${dir}/: ${entry.url}`)
      continue
    }
    listed.add(path)
    const plugin = loadPlugin(path, entry.type)
    if (!plugin) continue
    if (relative(root, path) !== `${dir}/${plugin.id}.json`) fail(at, `file must be named ${dir}/${plugin.id}.json`)
    for (const field of ['id', 'type', 'name', 'version', 'source', 'author', 'homepage']) {
      if (plugin[field] !== entry[field]) {
        fail(at, `${field} "${entry[field] ?? '(none)'}" differs from the plugin's "${plugin[field] ?? '(none)'}"`)
      }
    }
  }
  for (const { dir } of Object.values(TYPES)) {
    for (const path of jsonFiles(dir)) {
      if (!listed.has(path)) fail(relative(root, path), 'not listed in index.json')
    }
  }
}

for (const path of jsonFiles('examples')) loadPlugin(path)

if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`)
  process.exitCode = 1
} else {
  const count = Object.values(TYPES).reduce((n, { dir }) => n + jsonFiles(dir).length, 0)
  console.log(`✓ index.json and ${count} plugins are valid`)
}
