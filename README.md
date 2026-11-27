# Cairn provider plugins

The official catalog of **provider plugins** for [Cairn](https://github.com/960602906/Cairn). A provider
plugin is a JSON file that adds model services (an API address, its format, and sensible defaults) to
Cairn's **Settings → Model providers → Add provider** list. Cairn reads [`index.json`](index.json) to show
what can be installed, then downloads the chosen plugin file.

Plugins are **data only**. They contain no code, can't change how requests are made, and can only use
the API formats and compatibility settings Cairn already supports.

这是 Cairn 官方的供应商插件目录。插件是只含数据的 JSON 文件，为“添加供应商”列表增加服务；Cairn 读取
`index.json` 列出可安装的插件，再下载用户选中的插件文件。插件不含代码。

> [!IMPORTANT]
> **Trust note.** The API key you enter for a plugin's service is sent to the addresses that plugin
> declares (`baseUrl` and each `regions[].baseUrl`). Cairn shows those addresses before you install.
> Only install plugins whose addresses you trust. This catalog lists official endpoints of established
> services and software on your own computer, and reviews every change, but it can't vouch for a
> service's own handling of your key or data.
>
> 你为插件中的服务填写的 Key 会发送到插件声明的地址。安装前 Cairn 会列出这些地址，只安装你信任的插件。

## Catalog

| Plugin | Service | Format | Group | Address |
|---|---|---|---|---|
| [`cerebras`](plugins/cerebras.json) | Cerebras | OpenAI | Gateways and relays | `https://api.cerebras.ai/v1` |
| [`groq`](plugins/groq.json) | Groq | OpenAI | Gateways and relays | `https://api.groq.com/openai/v1` |
| [`llama-cpp`](plugins/llama-cpp.json) | llama.cpp server | OpenAI | On this computer | `http://localhost:8080/v1` |
| [`together`](plugins/together.json) | Together AI | OpenAI | Gateways and relays | `https://api.together.ai/v1` |
| [`vllm`](plugins/vllm.json) | vLLM | OpenAI | On this computer | `http://localhost:8000/v1` |

Services Cairn already has built in (DeepSeek, Anthropic, OpenAI, Gemini, Qwen, Kimi, Zhipu GLM, Z.ai,
MiniMax, Volcengine Ark, xAI, OpenRouter, SiliconFlow, Vercel AI Gateway, Ollama, LM Studio) aren't
repeated here.

[`examples/acme.json`](examples/acme.json) is a complete example using every field, including icons. It
uses the reserved `acme.example` domain and is deliberately **not** listed in the index.

## Layout

```text
index.json                         the catalog Cairn reads
plugins/<id>.json                  one plugin per file, named after its id
examples/acme.json                 example plugin (not in the index)
schema/index.schema.json           JSON Schema for index.json
schema/provider-plugin.schema.json JSON Schema for plugin files
scripts/validate.mjs               checks everything above (npm run validate, also run in CI)
```

## How Cairn installs from this catalog

The index lives at:

```text
https://raw.githubusercontent.com/960602906/cairn-provider-plugins/main/index.json
```

1. Cairn downloads the index over https. If `schemaVersion` isn't `1`, it ignores the index and says
   that a newer Cairn is needed.
2. It lists the entries: `name`, `description`, `version`, and the icon (see [Icons](#icons)).
3. When the user picks one, Cairn resolves `url` against the index URL (a relative path such as
   `plugins/groq.json` becomes `…/main/plugins/groq.json`) and downloads the plugin file.
4. It validates the file exactly as **Install from file…** does: at most 256 KiB, a valid
   `ProviderPluginManifest`. The plugin's `id` must equal the index entry's `id`, otherwise the install
   is refused.
5. It shows the same preview as a file install, including every address a key will be sent to, and on
   confirm saves the file as `provider-plugins/<id>.json`, replacing an installed plugin with the same
   id.

An installed plugin whose `version` differs from the index entry's `version` can be offered as an
update. Versions are compared for equality only; no ordering is implied. Everything else (removing a
plugin, providers already added from it keeping working) behaves as for plugins installed from a file.
Without network access Cairn keeps working with its built-in list and the plugins already installed.

## `index.json` format

```json
{
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "acme",
      "name": "Acme Cloud",
      "version": "1.0.0",
      "description": "Example provider plugin.",
      "homepage": "https://acme.example",
      "icon": "icons/acme.svg",
      "url": "plugins/acme.json"
    }
  ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `schemaVersion` | yes | Always `1`. |
| `plugins` | yes | The plugins, sorted by `id`. |
| `plugins[].id` | yes | The plugin id; must equal `id` in the plugin file. |
| `plugins[].name` | yes | Display name, 1–80 characters; equals `name` in the plugin file. |
| `plugins[].version` | yes | Equals `version` in the plugin file. |
| `plugins[].description` | no | Up to 280 characters. |
| `plugins[].homepage` | no | https URL; equals `homepage` in the plugin file. Used for the favicon fallback without downloading the plugin. |
| `plugins[].icon` | no | https URL, or a path relative to `index.json`. See [Icons](#icons). |
| `plugins[].url` | yes | Where the plugin file is: an https URL, or a path relative to `index.json` (no leading `/`, no `..`). Entries in this repo always use `plugins/<id>.json`. |

Unknown fields are ignored, so optional fields can be added later without breaking older versions of
Cairn.

## Plugin format

A plugin file is Cairn's `ProviderPluginManifest` (`@cairn/protocol`, `schemaVersion: 1`) plus optional
`icon` fields. Cairn's authoring guide, `docs/dev/provider-plugins.md` (added in
[Cairn PR #299](https://github.com/960602906/Cairn/pull/299)), has the details;
[`schema/provider-plugin.schema.json`](schema/provider-plugin.schema.json) encodes the same rules for
editors and CI.

```json
{
  "schemaVersion": 1,
  "id": "acme",
  "name": "Acme Cloud",
  "version": "1.0.0",
  "description": "Example provider plugin.",
  "homepage": "https://acme.example",
  "icon": "https://acme.example/icon.svg",
  "providers": [
    {
      "id": "gateway",
      "name": "Acme Gateway",
      "icon": "https://acme.example/gateway.svg",
      "kind": "openai",
      "category": "relay",
      "baseUrl": "https://api.acme.example/v1",
      "keysUrl": "https://console.acme.example/keys",
      "suggestedModels": ["acme-coder"]
    }
  ]
}
```

Top level:

| Field | Required | Meaning |
|---|---|---|
| `schemaVersion` | yes | Always `1`. |
| `id` | yes | Lowercase letters, digits and `-`, 1–64 characters, not starting or ending with `-`. Also the file name. |
| `name` | yes | 1–80 characters. |
| `version` | no (required in this catalog) | Up to 32 characters. Bump it whenever the file changes. |
| `description` | no | Up to 280 characters. |
| `homepage` | no | https URL. |
| `icon` | no | https URL of the plugin's icon. See [Icons](#icons). |
| `providers` | yes | 1–32 services with unique `id`s. |

Each entry in `providers`:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Same rules as the plugin id. In Cairn the service becomes `<plugin id>.<provider id>`, for example `groq.api`, so it can't clash with built-in services. |
| `name` | yes | 1–80 characters, shown in the list and on the provider. |
| `icon` | no | https URL of this service's icon. See [Icons](#icons). |
| `kind` | yes | API format: `openai` (Chat Completions), `anthropic` (Messages) or `gemini`. |
| `baseUrl` | yes | `http` or `https`, without user name or password. `openai` usually ends in `/v1`; `anthropic` has no `/v1`; `gemini` includes the version, such as `/v1beta`. |
| `category` | no | `vendor`, `relay` (default) or `local`: the group shown in Cairn. |
| `regions` | no | 2–4 of `{ "id": "global" \| "cn", "baseUrl", "keysUrl"? }`, unique ids; `baseUrl` must be one of them. |
| `requiresKey` | no | Default `true`. `false` makes the key optional (local servers). |
| `keysUrl` | no | https page where users create a key. |
| `compat` | no | Differences between OpenAI-compatible services (only used for `openai`): `thinkingFormat` (`openai`, `deepseek`, `qwen`, `openrouter`, `zai`), `maxTokensField` (`max_tokens`, `max_completion_tokens`), `supportsDeveloperRole`, `supportsStore`, `supportsReasoningEffort`, `supportsUsageInStreaming`, `requiresReasoningContentOnAssistantMessages`, `supportsStrictMode`. Unknown fields are an error. |
| `models` | no | Up to 64 preset models. Only `id` is required; also `displayName`, `contextWindow`, `maxOutputTokens`, `supportsTools`, `supportsParallelToolCalls`, `supportsReasoning`, `thinkingLevel` (`low`, `medium`, `high`), `pricing` (`inputPerMillion`, `outputPerMillion`, `cacheReadPerMillion?`). Missing capabilities come from `modelDefaults`. |
| `suggestedModels` | no | Up to 16 model ids to switch on after Cairn fetches the service's model list. Ids the service doesn't list are skipped. |
| `modelDefaults` | no | Capabilities for fetched or manually added models: `contextWindow`, `maxOutputTokens`, `supportsTools`, `supportsParallelToolCalls`, `supportsReasoning`. Cairn's own default is 128k context, 16k output, tools and parallel tool calls on, reasoning off. |

Other unknown fields (such as the `$schema` line used for editor support) are ignored.

### Icons

`icon` is optional everywhere, and most plugins here leave it out.

- **In plugin files**, `icon` must be an absolute https URL, because Cairn copies the plugin to disk and
  reads it on its own later. To use an image stored in this repo, use its raw URL:
  `https://raw.githubusercontent.com/960602906/cairn-provider-plugins/main/icons/<file>`.
- **In `index.json`**, `icon` may also be a path relative to `index.json`, such as `icons/acme.svg`.
- Use a square SVG or PNG, at least 64×64, preferably under 64 KB. Cairn displays it as an image and
  never as inline markup.
- When `icon` is missing, Cairn falls back in this order: the provider's `icon`, the plugin's `icon`,
  then the site's favicon, taken from `keysUrl`, `homepage` or `baseUrl` (addresses on this computer
  are skipped). In the index list, the fallback is the entry's `homepage` favicon.

Only commit logo files that may be redistributed. When in doubt, link to an image the service hosts, or
leave `icon` out and let the favicon fallback do the work.

## Adding or updating a plugin

1. Create `plugins/<id>.json`. Start from [`examples/acme.json`](examples/acme.json) and keep the
   `"$schema": "../schema/provider-plugin.schema.json"` line for editor validation.
2. Add a matching entry to `index.json` (sorted by `id`) with the same `id`, `name`, `version` and
   `homepage`, and `"url": "plugins/<id>.json"`. Add a row to the table above.
3. When you change an existing plugin, bump `version` in both the plugin and the index.
4. Run the checks:

   ```bash
   npm ci
   npm run validate
   ```

5. Open a pull request saying how you checked the address, format and `compat` settings: links to the
   service's official API docs and, ideally, a short test with Cairn's **Test connection**.

What gets accepted:

- **Official endpoints only.** The address must come from the service's own documentation. No
  unofficial relays, resellers, mirrors or personal proxies; users can still add those with Cairn's
  **Custom endpoint**.
- **https for hosted services.** Plain `http` and `requiresKey: false` are only allowed for
  `"category": "local"` services on the user's own computer.
- **No duplicates** of services Cairn already has built in, and one plugin per service.
- **Conservative defaults.** Prefer `suggestedModels` over a hard-coded `models` list, since model ids
  change often. Only turn on `supportsReasoning` when the service accepts Cairn's reasoning settings for
  most models it serves.
- **Data only.** No scripts or executables, and no logo files that can't be redistributed.

## Compatibility promise

This repo is a contract with released versions of Cairn, so changes to it are additive:

- New optional fields may appear in the index or in plugin files. Cairn ignores fields it doesn't know.
- `index.json` stays at `schemaVersion: 1` and only lists plugins with `schemaVersion: 1`. If a breaking
  change is ever needed, it will be published under a new file name (for example `index.v2.json`) so
  older versions of Cairn keep working.
- Plugin ids are never reused for a different service.

## License

[MIT](LICENSE), the same as Cairn. Service names belong to their owners and are used only to identify
the services.
