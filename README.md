# Cairn plugin catalog

Cairn's plugin catalog for [Cairn](https://github.com/960602906/Cairn). Cairn reads
[`index.json`](index.json) to show what can be installed, then downloads the chosen plugin file.

Today the catalog lists **provider plugins** (`"type": "provider"`). A provider plugin is a JSON file
that adds model services (an API address, its format, and sensible defaults) to Cairn's
**Settings → Model providers → Add provider** list. Other kinds of Cairn plugins, such as skills, will
later live in this same repository. Each index entry says what kind of plugin it is in its `type` field,
each kind gets its own folder, and Cairn skips entries whose `type` it doesn't understand. The repository
keeps its `cairn-provider-plugins` name so existing URLs keep working.

Plugins are **data only**. They contain no code, can't change how requests are made, and can only use
the API formats and compatibility settings Cairn already supports.

这是 Cairn 的插件目录。目前只收录供应商（API）插件（`"type": "provider"`）：只含数据的 JSON 文件，为“添加供应商”
列表增加服务。以后其他类型的 Cairn 插件（例如技能）也会放在这个仓库，用 `type` 区分、各用各的文件夹；Cairn
会跳过它不认识的类型。每个插件都标明是官方（`official`）还是第三方（`third-party`）、作者（`author`）和主页
（`homepage`）。Cairn 读取 `index.json` 列出可安装的插件，再下载用户选中的插件文件。插件不含代码。

> [!IMPORTANT]
> **Trust note.** The API key you enter for a plugin's service is sent to the addresses that plugin
> declares (`baseUrl` and each `regions[].baseUrl`). Cairn shows those addresses before you install.
> Only install plugins whose addresses you trust. Every plugin says whether it is official or
> third-party and who wrote it. This catalog lists official endpoints of established services and
> software on your own computer, and reviews every change, official or third-party, but it can't vouch
> for a service's own handling of your key or data.
>
> 你为插件中的服务填写的 Key 会发送到插件声明的地址。安装前 Cairn 会列出这些地址，只安装你信任的插件。

## Catalog

### Provider plugins

| Plugin | Service | Format | Group | Address | Source |
|---|---|---|---|---|---|
| [`cerebras`](plugins/cerebras.json) | Cerebras | OpenAI | Gateways and relays | `https://api.cerebras.ai/v1` | Official (Cairn) |
| [`groq`](plugins/groq.json) | Groq | OpenAI | Gateways and relays | `https://api.groq.com/openai/v1` | Official (Cairn) |
| [`llama-cpp`](plugins/llama-cpp.json) | llama.cpp server | OpenAI | On this computer | `http://localhost:8080/v1` | Official (Cairn) |
| [`together`](plugins/together.json) | Together AI | OpenAI | Gateways and relays | `https://api.together.ai/v1` | Official (Cairn) |
| [`vllm`](plugins/vllm.json) | vLLM | OpenAI | On this computer | `http://localhost:8000/v1` | Official (Cairn) |

Services Cairn already has built in (DeepSeek, Anthropic, OpenAI, Gemini, Qwen, Kimi, Zhipu GLM, Z.ai,
MiniMax, Volcengine Ark, xAI, OpenRouter, SiliconFlow, Vercel AI Gateway, Ollama, LM Studio) aren't
repeated here.

[`examples/acme.json`](examples/acme.json) is a complete example using every field, including icons. It
is written as a third-party plugin, uses the reserved `acme.example` domain, and is deliberately **not**
listed in the index.

## Official and third-party plugins

Every plugin, in `index.json` and in its own file, carries three fields that tell users who stands
behind it:

- **`source`** is `"official"` or `"third-party"`.
  - `official` plugins are maintained by the Cairn project in this repository. All plugins listed today
    are official.
  - `third-party` plugins are written and maintained by someone else: the service's own team, or anyone
    who wants to publish one. They go through the same review and the same rules as official plugins
    (see [Third-party plugins](#third-party-plugins)). "Third-party" describes who wrote the plugin, not
    the service: the addresses must still be the service's official ones.
- **`author`** is the display name of the plugin's author or organization. Official plugins use
  `"Cairn"`; third-party plugins use their own name and may not use `"Cairn"`.
- **`homepage`** is the plugin's website, an https URL that Cairn shows as a link. For a provider plugin
  this is usually the service's site; a third-party author may point it at the plugin's own page or
  repository instead. It is also the first place Cairn looks for a favicon (see [Icons](#icons)).

## Layout

```text
index.json                         the catalog Cairn reads (all plugin types)
plugins/<id>.json                  provider plugins, one per file, named after the id
examples/acme.json                 example provider plugin (third-party, not in the index)
schema/index.schema.json           JSON Schema for index.json
schema/provider-plugin.schema.json JSON Schema for provider plugin files
scripts/validate.mjs               checks everything above (npm run validate, also run in CI)
```

Provider plugins stay at `plugins/<id>.json`. Each later `type` gets its own folder (for example
`skills/<id>.json`) and its own schema in `schema/`; see [Adding a plugin type](#adding-a-plugin-type).

## How Cairn installs from this catalog

The index lives at:

```text
https://raw.githubusercontent.com/960602906/cairn-provider-plugins/main/index.json
```

1. Cairn downloads the index over https. If `schemaVersion` isn't `1`, it ignores the index and says
   that a newer Cairn is needed.
2. It skips entries whose `type` it doesn't understand, and lists the rest: `name`, `description`,
   `version`, the author and whether the plugin is official or third-party, a link to `homepage`, and the
   icon (see [Icons](#icons)).
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
      "type": "provider",
      "name": "Acme Cloud",
      "version": "1.0.0",
      "description": "Example provider plugin.",
      "source": "third-party",
      "author": "Acme Inc.",
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
| `plugins` | yes | The plugins of every type, sorted by `id`. Ids are unique across the whole index. |
| `plugins[].id` | yes | The plugin id; must equal `id` in the plugin file. |
| `plugins[].type` | yes in this catalog | The kind of plugin: `provider` for API/provider plugins, the only type today. Lowercase letters, digits and `-`. Cairn skips types it doesn't understand. Equals `type` in the plugin file. |
| `plugins[].name` | yes | Display name, 1–80 characters; equals `name` in the plugin file. |
| `plugins[].version` | yes | Equals `version` in the plugin file. |
| `plugins[].description` | no | Up to 280 characters. |
| `plugins[].source` | yes in this catalog | `official` or `third-party`; equals `source` in the plugin file. |
| `plugins[].author` | yes in this catalog | Author or organization, 1–80 characters (`Cairn` for official plugins); equals `author` in the plugin file. |
| `plugins[].homepage` | no | The plugin's website, an https URL shown as a link; equals `homepage` in the plugin file. Also used for the favicon fallback without downloading the plugin. |
| `plugins[].icon` | no | https URL, or a path relative to `index.json`. See [Icons](#icons). |
| `plugins[].url` | yes | Where the plugin file is: an https URL, or a path relative to `index.json` (no leading `/`, no `..`). Entries in this repo always use their type's folder: `plugins/<id>.json` for provider plugins. |

Unknown fields are ignored, so optional fields can be added later without breaking older versions of
Cairn.

## Plugin format

A provider plugin file is Cairn's `ProviderPluginManifest` (`@cairn/protocol`, `schemaVersion: 1`) plus
the optional `icon`, `type`, `source` and `author` fields. Cairn's authoring guide,
`docs/dev/provider-plugins.md` (added in [Cairn PR #299](https://github.com/960602906/Cairn/pull/299)),
has the details; [`schema/provider-plugin.schema.json`](schema/provider-plugin.schema.json) encodes the
same rules for editors and CI.

```json
{
  "schemaVersion": 1,
  "id": "acme",
  "type": "provider",
  "name": "Acme Cloud",
  "version": "1.0.0",
  "description": "Example provider plugin.",
  "source": "third-party",
  "author": "Acme Inc.",
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
| `type` | no (required in this catalog) | Always `provider` for provider plugins. |
| `name` | yes | 1–80 characters. |
| `version` | no (required in this catalog) | Up to 32 characters. Bump it whenever the file changes. |
| `description` | no | Up to 280 characters. |
| `source` | no (required in this catalog) | `official` (maintained by Cairn) or `third-party`. See [Official and third-party plugins](#official-and-third-party-plugins). |
| `author` | no (required in this catalog) | Author or organization, 1–80 characters. `Cairn` for official plugins; third-party plugins use their own name. |
| `homepage` | no | https URL of the plugin's website, shown as a link. |
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
  then the site's favicon. For the favicon it tries `homepage` first, then `keysUrl`, then `baseUrl`
  (addresses on this computer are skipped). `homepage` comes first because console pages such as
  `keysUrl` often redirect to a sign-in page with a generic icon. In the index list, the fallback is the
  entry's `homepage` favicon.

Only commit logo files that may be redistributed. When in doubt, link to an image the service hosts, or
leave `icon` out and let the favicon fallback do the work.

## Adding or updating a plugin

1. Create `plugins/<id>.json`. Start from [`examples/acme.json`](examples/acme.json) and keep the
   `"$schema": "../schema/provider-plugin.schema.json"` line for editor validation. Set
   `"type": "provider"`, and set `source` and `author` as described in
   [Official and third-party plugins](#official-and-third-party-plugins).
2. Add a matching entry to `index.json` (sorted by `id`) with the same `id`, `type`, `name`, `version`,
   `source`, `author` and `homepage`, and `"url": "plugins/<id>.json"`. Add a row to the table above.
3. When you change an existing plugin, bump `version` in both the plugin and the index.
4. Run the checks:

   ```bash
   npm ci
   npm run validate
   ```

5. Open a pull request saying how you checked the address, format and `compat` settings: links to the
   service's official API docs and, ideally, a short test with Cairn's **Test connection**.

### Third-party plugins

Anyone can propose a plugin they wrote, including a service's own team. It is added the same way, through
a pull request that is reviewed against the same rules as official plugins:

- Set `"source": "third-party"` and put your name or organization in `author`, in both the plugin file
  and its index entry. `author` may not be `Cairn`.
- Set `homepage` to a page where users can find out more: the service's site, or your own page or
  repository for the plugin.
- Say in the pull request who you are and how you're related to the service, if at all.
- You keep maintaining the plugin: send a pull request with a bumped `version` when the service changes.
  Changes to your plugin from someone else should have your agreement in the pull request, unless they
  fix a broken or unsafe plugin.
- The maintainers may adopt a third-party plugin as official; it then becomes `"source": "official"`,
  `"author": "Cairn"`.

Being third-party doesn't relax any rule below. In particular, a third-party plugin for an unofficial
relay, reseller, mirror or proxy is still not accepted.

### What gets accepted

- **Official endpoints only.** The address must come from the service's own documentation. No
  unofficial relays, resellers, mirrors or personal proxies, whoever writes the plugin; users can still
  add those with Cairn's **Custom endpoint**.
- **https for hosted services.** Plain `http` and `requiresKey: false` are only allowed for
  `"category": "local"` services on the user's own computer.
- **No duplicates** of services Cairn already has built in, and one plugin per service.
- **Honest `source` and `author`.** `official` means maintained by Cairn with `author` `Cairn`;
  everything else is `third-party` under its real author.
- **Conservative defaults.** Prefer `suggestedModels` over a hard-coded `models` list, since model ids
  change often. Only turn on `supportsReasoning` when the service accepts Cairn's reasoning settings for
  most models it serves.
- **Data only.** No scripts or executables, and no logo files that can't be redistributed.

## Adding a plugin type

New kinds of plugins are added next to provider plugins, never in place of them:

1. Agree on the type name and file format with Cairn first; Cairn must understand the type before it
   can install it, and skips it until then.
2. Add a folder for the type (for example `skills/`) and a JSON Schema for its files in `schema/`. Each
   file still has `id`, `type`, `name`, `version`, `source` and `author`.
3. Register the type in the `TYPES` table in [`scripts/validate.mjs`](scripts/validate.mjs) with its
   folder, schema and any extra checks. CI rejects index entries whose `type` isn't registered.
4. List its plugins in the same `index.json`, and document the type in this README.

## Compatibility promise

This repo is a contract with released versions of Cairn, so changes to it are additive:

- New optional fields may appear in the index or in plugin files. Cairn ignores fields it doesn't know.
- New plugin `type`s may appear in the index. Cairn skips entries whose `type` it doesn't understand, so
  the provider plugins keep working in every version.
- `index.json` stays at `schemaVersion: 1` and only lists plugins with `schemaVersion: 1`. If a breaking
  change is ever needed, it will be published under a new file name (for example `index.v2.json`) so
  older versions of Cairn keep working.
- Provider plugins stay at `plugins/<id>.json`, and the repository keeps its name.
- Plugin ids are never reused for a different service.

## License

[MIT](LICENSE), the same as Cairn. Service names belong to their owners and are used only to identify
the services.
