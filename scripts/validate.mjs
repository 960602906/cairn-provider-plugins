// Validates index.json, plugins/*.json and examples/*.json against the schemas in schema/
// and the catalog rules in README.md. Usage: npm run validate
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLUGIN_MAX_BYTES = 256 * 1024

const errors = []
const fail = (file, message) => errors.push(`${file}: ${message}`)

function readJson(path) {
  const text = readFileSync(path, 'utf8')
  return { json: JSON.parse(text.replace(/^\uFEFF/, '')), bytes: Buffer.byteLength(text) }
}

const ajv = new Ajv2020({ allErrors: true, strict: true })
const validatePlugin = ajv.compile(readJson(join(root, 'schema/provider-plugin.schema.json')).json)
const validateIndex = ajv.compile(readJson(join(root, 'schema/index.schema.json')).json)

function schemaErrors(file, validate, data) {
  if (validate(data)) return true
  for (const e of validate.errors) fail(file, `${e.instancePath || '/'} ${e.message}`)
  return false
}

/** Rules the schema can't express: the same refinements as Cairn's zod schema, plus catalog policy. */
function checkPlugin(file, plugin) {
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

function loadPlugin(path) {
  const file = relative(root, path)
  let parsed
  try {
    parsed = readJson(path)
  } catch (e) {
    fail(file, `not valid JSON: ${e.message}`)
    return undefined
  }
  if (parsed.bytes > PLUGIN_MAX_BYTES) fail(file, `larger than ${PLUGIN_MAX_BYTES} bytes`)
  if (!schemaErrors(file, validatePlugin, parsed.json)) return undefined
  checkPlugin(file, parsed.json)
  return parsed.json
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
    if (entry.url.startsWith('https://')) {
      fail(at, 'plugins in this catalog must be files in plugins/ (use a relative url)')
      continue
    }
    if (entry.icon && !entry.icon.startsWith('https://') && !isFile(join(root, entry.icon))) {
      fail(at, `icon file not found: ${entry.icon}`)
    }
    const path = join(root, entry.url)
    if (relative(root, dirname(path)) !== 'plugins' || !isFile(path)) {
      fail(at, `url must point at an existing file in plugins/: ${entry.url}`)
      continue
    }
    listed.add(path)
    const plugin = loadPlugin(path)
    if (!plugin) continue
    if (relative(root, path) !== `plugins/${plugin.id}.json`) fail(at, `file must be named plugins/${plugin.id}.json`)
    if (plugin.id !== entry.id) fail(at, `id "${entry.id}" differs from the plugin's "${plugin.id}"`)
    if (plugin.name !== entry.name) fail(at, `name "${entry.name}" differs from the plugin's "${plugin.name}"`)
    if (plugin.version !== entry.version) {
      fail(at, `version "${entry.version}" differs from the plugin's "${plugin.version ?? '(none)'}"`)
    }
    if (plugin.homepage !== entry.homepage) {
      fail(at, `homepage "${entry.homepage ?? '(none)'}" differs from the plugin's "${plugin.homepage ?? '(none)'}"`)
    }
  }
  for (const path of jsonFiles('plugins')) {
    if (!listed.has(path)) fail(relative(root, path), 'not listed in index.json')
  }
}

for (const path of jsonFiles('examples')) loadPlugin(path)

if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`)
  process.exitCode = 1
} else {
  console.log(`✓ index.json and ${jsonFiles('plugins').length} plugins are valid`)
}
