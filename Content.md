---------------------------------------------------------
// .env.example
PUBLIC_BASE_URL=

OLLAMA_BASE_URL=
GEMINI_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
X_API_KEY=
---

***

---

// .github/workflows/deploy.yml
name: NPM CD
run-name: ${{ github.ref_name }}

permissions:
contents: write
packages: write
attestations: write
id-token: write

on:
release:
types: - published

concurrency:
group: ${{ github.workflow }}-${{ github.ref_name }}
cancel-in-progress: true

env:
REPO: ${{ github.repository }}
VERSION: ${{ github.ref_name }}

jobs:
publish:
runs-on: ubuntu-latest
strategy:
matrix:
registry: - url: https://npm.pkg.github.com
token: "GITHUB_TOKEN"
scope: "@${{ github.repository_owner }}" - url: https://registry.npmjs.org
token: "NPM_TOKEN"
scope: "@${{ github.repository_owner }}"

    steps:
      - name: 📥 Checkout Repo
        uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - name: 🛠️ Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: 📦 Install Dependencies
        run: bun install --frozen-lockfile

      - name: ⚙️ Publish Package
        env:
          NODE_AUTH_TOKEN: ${{ secrets[matrix.registry.token] }}
          REGISTRY_URL: ${{ matrix.registry.url }}
        run: |
          CLEAN_URL="${REGISTRY_URL#https://}"
          echo "//${CLEAN_URL}/:_authToken=${NODE_AUTH_TOKEN}" > ./.npmrc
          echo "registry=${REGISTRY_URL}" >> ./.npmrc
          bun publish --no-git-checks --access public
          rm ./.npmrc

---

---

// .github/workflows/integrate.yml
name: NPM CI

permissions:
contents: write
pull-requests: write

on:
push:
branches: - develop

jobs:
build:
if: >
!(
contains(github.event.head_commit.message, 'ci(release):') ||
contains(github.event.head_commit.message, '[skip ci]') ||
startsWith(github.event.head_commit.message, 'Merge pull request') ||
startsWith(github.event.head_commit.message, 'Merge branch')
)
runs-on: ubuntu-latest
steps: - name: 📥 Checkout Repo
uses: actions/checkout@v7
with:
fetch-depth: 0

      - name: 🛠️ Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: 📦 Install Dependencies
        run: bun install --frozen-lockfile

      - name: ⚙️ Build Artifacts
        run: bun run build

      # - name: ✅ Test Code
      #   run: bun run test

      - name: 🧹 Lint Code
        run: bun run lint || echo "Linting failed, but continuing"

      - name: 🧼 Format Code
        run: bun run format

      - name: 🤖 AutoFix Code
        uses: stefanzweifel/git-auto-commit-action@v7
        with:
          commit_message: "chore: apply code fixes [skip ci]"

      - name: 🏷️ Bump Version
        id: bump_version
        run: |
          rm -f CHANGELOG.md
          bunx changelogen@latest --bump
          CHLOG=$(cat CHANGELOG.md)
          echo -e "CHANGELOG_CONTENT<<EOF\n${CHLOG}\nEOF" >> $GITHUB_ENV
          git reset --hard
          bunx changelogen@latest --bump

      - name: 🔀 Create or Update Pull Request
        uses: peter-evans/create-pull-request@v8
        with:
          commit-message: "ci(release): update version"
          title: "ci(release): update version"
          body: ${{ env.CHANGELOG_CONTENT }}
          branch: "release/update-version"
          base: "develop"
          delete-branch: true

---

---

// .github/workflows/release.yml
name: NPM Release

permissions:
contents: write

on:
push:
branches: - main

jobs:
release:
if: contains(github.event.head_commit.message, 'ci(release):')
runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Repo
        uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - name: 🛠️ Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: 📝 Create Release Note
        run: bunx changelogen@latest gh release
        env:
          GITHUB_TOKEN: ${{secrets.GH_PAT}}

---

---

// .husky/commit-msg
#!/usr/bin/env sh

#Lint Commit
bun x commitlint --edit $1

---

---

// .husky/pre-commit
#!/usr/bin/env sh
set -e

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g')

if command -v gitleaks >/dev/null 2>&1 && [ -n "$STAGED_FILES" ]; then
for file in $STAGED_FILES; do
[ -f "$file" ] && gitleaks detect --source="$file" --no-git --no-banner --verbose || true
done
else
echo "⚠️ gitleaks not found; skipping secret scan"
fi

# Lint staged files with oxlint

if [ -n "$STAGED_FILES" ]; then
bun oxlint $STAGED_FILES --fix --no-error-on-unmatched-pattern || exit 1
fi

# Format staged files with oxfmt

bun oxfmt $STAGED_FILES --ignore-path=.oxfmtignore >/dev/null 2>&1 || true

git update-index --again
---------------------------------------------------------

---

// .oxfmtignore

# Build files

dist

# Node dependencies

node_modules

# Package Manager

package.json
bun.lock

# Config files

.oxlintrc.json
oxfmtrc.json
.oxfmtignore

# Logs

logs
*.log
dump-body.json

# Documentation

docs

# Misc

.DS_Store
.fleet
.idea

# Test

coverage

# Env files

.env*
!.env.example

# Temporary Files

temp
---------------------------------------------------------

---

// .oxlintrc.json
{
"$schema": "https://oxc.rs/schemas/config/oxlintrc.json",
"categories": {
"correctness": "error",
"suspicious": "warn",
"pedantic": "off",
"perf": "warn",
"style": "off",
"restriction": "off"
},
"rules": {
"typescript/ban-ts-comment": "off",
"unicorn/no-anonymous-default-export": "off",
"unicorn/consistent-function-scoping": "off",
"no-await-in-loop": "off"
},
"env": {
"node": true,
"browser": true
},
"ignorePatterns": [
"dist",
"node_modules",
"temp",
"coverage",
"docs",
"**/*.md",
"dump-body.json"
]
}
---------------------------------------------------------

---

// CHANGELOG.md

# Changelog

# unai

## v0.3.9

[compare changes](https://github.com/shba007/unai/compare/v0.3.8...v0.3.9)

### 🏡 Chore

- Update package dependencies and package manager version ([79b0488](https://github.com/shba007/unai/commit/79b0488))

### ❤️ Contributors

- Shirsendu Bairagi ([@shba007](https://github.com/shba007))

## v0.3.8

[compare changes](https://github.com/shba007/unai/compare/v0.3.7...v0.3.8)

### 🏡 Chore

- Update docker images and dependencies ([637a172](https://github.com/shba007/unai/commit/637a172))
- Update package dependencies and package manager version ([74844e3](https://github.com/shba007/unai/commit/74844e3))

### ❤️ Contributors

- Shirsendu Bairagi ([@shba007](https://github.com/shba007))

## v0.3.7

[compare changes](https://github.com/shba007/unai/compare/v0.3.6...v0.3.7)

### 🏡 Chore

- Update package.json dependencies and package manager version ([9914dc9](https://github.com/shba007/unai/commit/9914dc9))

### ❤️ Contributors

- Shirsendu Bairagi ([@shba007](https://github.com/shba007))

## v0.3.6

[compare changes](https://github.com/shba007/unai/compare/v0.3.5...v0.3.6)

### 🏡 Chore

- Package.json for version upgrades and formatting improvements ([d909ff6](https://github.com/shba007/unai/commit/d909ff6))

### ❤️ Contributors

- Shba007 ([@shba007](https://github.com/shba007))

## v0.3.5

[compare changes](https://github.com/shba007/unai/compare/v0.3.4...v0.3.5)

### 🩹 Fixes

- Update model reference in output example and adjust package dependencies ([921c4a2](https://github.com/shba007/unai/commit/921c4a2))

### ❤️ Contributors

- Shba007 ([@shba007](https://github.com/shba007))

## v0.3.4

[compare changes](https://github.com/shba007/unai/compare/v0.3.3...v0.3.4)

### 🏡 Chore

- Update NPM publish configuration and improve Google model support ([81dcc2e](https://github.com/shba007/unai/commit/81dcc2e))

### ❤️ Contributors

- Shba007 ([@shba007](https://github.com/shba007))

## v0.3.3

[compare changes](https://github.com/shba007/unai/compare/v0.3.2...v0.3.3)

### 🏡 Chore

- Remove unused scripts and devDependencies from package.json ([f28a65e](https://github.com/shba007/unai/commit/f28a65e))

### ❤️ Contributors

- Shba007 ([@shba007](https://github.com/shba007))

## v0.3.2

[compare changes](https://github.com/shba007/unai/compare/v0.3.1...v0.3.2)

### 🚀 Enhancements

- Add tool-use functionality and update package dependencies ([3c3da63](https://github.com/shba007/unai/commit/3c3da63))

### 💅 Refactors

- Unai-web merged into unai making it a mono repo ([b27e7ad](https://github.com/shba007/unai/commit/b27e7ad))
- Clean up code and improve readability in OpenAI model handling ([02de0f4](https://github.com/shba007/unai/commit/02de0f4))

### 🏡 Chore

- Removed blog-related content and layouts, including articles, icons, and styles ([e72ac70](https://github.com/shba007/unai/commit/e72ac70))

### ❤️ Contributors

- Shba007 ([@shba007](https://github.com/shba007))
- Shirsendu Bairagi ([@shba007](https://github.com/shba007))

## 0.3.1

### Patch Changes

- 6a2bab9: docs: update project name to unai in README

## 0.3.0

### Minor Changes

- 7d8f383: feat: add audio transcription functionality and update example files

## 0.2.6

### Patch Changes

- edef46e: fix: improve stream processing by buffering incomplete chunks and handling parsing errors

## 0.2.5

### Patch Changes

- 8adaab4: fix: wrap stream reading in a promise to ensure proper resolution

## 0.2.4

### Patch Changes

- 9594df9: feat: add debug callback to AI run function for enhanced logging

## 0.2.3

### Patch Changes

- 67ed408: refactor: add debug callback to API functions for enhanced logging

## 0.2.2

### Patch Changes

- c983319: refactor: update model references and streamline request body construction for Google and OpenAI APIs

## 0.2.1

### Patch Changes

- 6108295: refactor: replace pipeStream with mapStream for improved stream handling and update example scripts

## 0.2.0

### Minor Changes

- 4ae3d62: feat: add new example scripts for audio and image generation, add new openai models
- e4b5dab: feat: add example scripts and added image support for openai

## 0.1.1

### Patch Changes

- 4d2af6e: chore: add commitlint and husky for commit message linting

## 0.1.0

### Minor Changes

- 79b419e: feat(unai): implement initial version of the UnAI library

### Patch Changes

- 0c80c59: chore: add initial files and configurations for the project

  This commit includes the following changes:
  - Adds basic project files such as LICENSE, README, .gitignore, .prettierignore, etc.
  - Sets up configurations for ESLint, Prettier, Renovate, and TypeScript.
  - Adds initial test setup with Vitest.
  - Introduces a basic implementation of the UnAI library with support for different models and providers.
  - Includes utility functions for CSV parsing, path creation, promise pooling, stream reading, and slugification.
  - Adds support for structured output and function calling.
  - Improves code structure and organization.
  - Updates documentation and examples.

- 23b051e: ci: add CI and CD workflows

  Adds CI and CD workflows to automate the build, test, and release process. The CI workflow runs on every push to the 'develop' branch and includes linting. The CD workflow runs on every tag push and publishes the package to NPM. This change improves the development workflow and ensures code quality.

---

---

// docker-compose.yml
name: "unai-dev"
services:
web: # image: 'ghcr.io/shba007/unai-web:latest'
build: ./docs
restart: on-failure:3
env_file: - ./docs/.env.prod
ports: - 3200:8000

api: # image: 'ghcr.io/shba007/unai-api:latest'
build: ../unai-api
restart: on-failure:3
env_file: - ../unai-api/.env.prod
ports: - 2300:8000

scout: # image: 'ghcr.io/shba007/unai-api:latest'
build: ../unai-scout
restart: on-failure:3
env_file: - ../unai-scout/.env.prod
ports: - 2310:4200

prefect-server:
image: prefecthq/prefect:3.2-python3.12
restart: on-failure:3
ports: - "1410:4200"
environment:
PREFECT_API_URL: "http://localhost:1410/api"
PREFECT_SERVER_API_HOST: "0.0.0.0"
PREFECT_API_DATABASE_CONNECTION_URL: "postgresql+asyncpg://postgres:postgres@postgres:5432/main"
PREFECT_API_DATABASE_MIGRATE_ON_START: True
command: ["prefect", "server", "start"]

open-webui:
image: ghcr.io/open-webui/open-webui:main
restart: on-failure:3
ports: - 1101:8080
environment: - OLLAMA_BASE_URL=http://ollama:9090
volumes: - open-webui:/app/backend/data

ollama:
image: ollama/ollama:0.13.3-rocm
restart: on-failure:3
ports: - 1100:11434
volumes: - ../unai-models/models/ollama:/root/.ollama

invokeai:
image: ghcr.io/invoke-ai/invokeai:6.9-cpu
restart: on-failure:3
ports: - 1110:9090 # runtime: nvidia # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
volumes: - ../unai-models/models/invokeai:/app/invokeai

imagebind:
image: r8.im/daanelson/imagebind
restart: on-failure:3
ports: - 1200:5000 # runtime: nvidia # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu

grounding-dino:
image: r8.im/adirik/grounding-dino
restart: on-failure:3
ports: - 1201:5000 # runtime: nvidia # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu

deepseek-ai-deepseek-vl2-small:
image: registry.hf.space/deepseek-ai-deepseek-vl2-small:latest
stdin_open: true
tty: true
ports: - 1206:7860
platform: linux/amd64 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
command: python app.py
yonigozlan-got-ocr-transformers:
image: registry.hf.space/yonigozlan-got-ocr-transformers:latest
stdin_open: true
tty: true
ports: - 1217:7860
platform: linux/amd64 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
command: python app.py

atlury-jiovirtualtryon:
image: registry.hf.space/atlury-jiovirtualtryon:latest
stdin_open: true
tty: true
ports: - 1211:7860
platform: linux/amd64 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
command: python app.py

ahkamboh-change-cloth-ai:
image: registry.hf.space/ahkamboh-change-cloth-ai:latest
platform: linux/amd64
stdin_open: true
tty: true
ports: - 1212:7860
environment: - HUGGING_FACE_HUB_TOKEN=YOUR_VALUE_HERE
command: python app.py

usmanyousaf-virtual-dressup:
image: registry.hf.space/usmanyousaf-virtual-dressup:latest
platform: linux/amd64
stdin_open: true
tty: true
ports: - 1213:7860
command: streamlit run app.py

mrfreak72-dressifyfullbody:
image: registry.hf.space/mrfreak72-dressifyfullbody:latest
platform: linux/amd64
ports: - 1214:7860
stdin_open: true
tty: true
command: python app.py

louu007-issatm-vto:
image: registry.hf.space/louu007-issatm-vto:latest
platform: linux/amd64
stdin_open: true
tty: true
ports: - 1215:7860
command: python app.py

rlawjdghek-stableviton:
image: registry.hf.space/rlawjdghek-stableviton:latest
platform: linux/amd64
stdin_open: true
tty: true
ports: - 1216:7860 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
command: python app.py

pramallc-ben2:
image: registry.hf.space/pramallc-ben2:latest
stdin_open: true
tty: true
ports: - 1218:7860
platform: linux/amd64 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
command: python app.py

sonitranslate:
image: registry.hf.space/r3gm-sonitranslate-translate-audio-of-a-video-content:latest
stdin_open: true
tty: true
ports: - 1219:7860
platform: linux/amd64 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
environment: - OPENAI_API_KEY=YOUR_VALUE_HERE - YOUR_HF_TOKEN=YOUR_VALUE_HERE - ZERO_GPU=TRUE - IS_DEMO=TRUE
command: python app_rvc.py

steveeeeeeen-zonos:
image: registry.hf.space/steveeeeeeen-zonos:latest
stdin_open: true
tty: true
ports: - 1205:7860
platform: linux/amd64 # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu
command: python app.py

kokoro:
image: r8.im/jaaari/kokoro-82m
restart: on-failure:3
ports: - 1202:5000 # runtime: nvidia # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu

seamless-communication:
image: r8.im/cjwbw/seamless_communication
restart: on-failure:3
ports: - 1203:5000 # runtime: nvidia # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu

realistic-voice-cloning:
image: r8.im/zsxkib/realistic-voice-cloning
restart: on-failure:3
ports: - 1204:5000 # runtime: nvidia # deploy: # resources: # reservations: # devices: # - driver: nvidia # count: all # capabilities: # - gpu

tf-serve:
image: "tensorflow/serving:2.19.0"
restart: on-failure:3
ports: - 1310:8500 - 1311:8501
volumes: - type: bind
source: ../unai-models/dist/models
target: /models
command: "--model_config_file=/models/models.config"

torchserve:
image: pytorch/torchserve:0.12.0-cpu
restart: on-failure:3
ports: - 1320:8080 - 1321:8081 - 1322:8082 - 1323:7070 - 1324:7071
volumes: - type: bind
source: ../unai-models/dist/models
target: /home/model-server/model-store
command: torchserve --model-store /home/model-server/model-store --models my_model=TranslationClassifier.mar

postgres:
image: postgres:18-alpine
command: "-d 1"
volumes: - db-data:/var/lib/postgresql/data
environment: - POSTGRES_USER=postgres - POSTGRES_PASSWORD=postgres - POSTGRES_DB=main
healthcheck:
test: ["CMD-SHELL", "pg_isready -U postgres"]
interval: 10s
timeout: 5s
retries: 5

volumes:
db-data:
open-webui:

---

---

// examples/input-audio.ts
import fs from "node:fs";
import { initAI } from "../src";

const ai = initAI(),

filePath = "./examples/prompt1.wav",
audioBuffer = fs.readFileSync(filePath),

result = await ai.run("audio-transcribe", "@OpenAI/whisper-v2", {
messages: [
{
content: {
// Audios: ['file://test.mp3],
audios: [audioBuffer],
},
role: "user",
},
],
});

console.log({ result: result.content });

---

---

// examples/input-image.ts
import { initAI } from "../src";

const ai = initAI(),

imageIds = ["4e76ccc5-8381-4b21-be22-636808e7b7c8", "a9193fed-769a-47bd-ac70-afceb8ff5295"],

result = await ai.run("image-caption", "@OpenAI/o1:latest", {
messages: [
{
content: {
images: imageIds.map(
(id) =>
`https://ucarecdn.com/${id}/-/format/auto/-/quality/smart/-/scale_crop/1280x1920/center/`,
),
text: "Write the alt text for seo for each image",
},
role: "user",
},
],
});

console.log({ result: result.content });

---

---

// examples/input-text.ts
import fs from "node:fs";
import { initAI } from "../src";

const ai = initAI(),

result = await ai.run(
"text-generate",
"@Google/gemini-2.0-flash-lite",
{
messages: [
{
content: "reply in one word",
role: "system",
},
{
content: "What is the sky color",
role: "user",
},
{
content: "Blue",
role: "assistant",
},
{
content: "What is the sea color",
role: "user",
},
],
},
(body: object) => {
fs.writeFileSync("./dump-body.json", JSON.stringify(body, undefined, 2));
},
);

console.log({ result: result.content });

---

---

// examples/output-audio.ts
import { initAI } from "../src";

const ai = initAI(),

result = await ai.run("audio-generation", "@Google/gemini-1.5-flash-8b", {
prompt: "Sound of river",
});

console.log({ result: result.content });

---

---

// examples/output-function-call.ts
import fs from "node:fs";
import { initAI } from "../src";
import type { Tool } from "../src/types";

const ai = initAI(),

tools: Record<string, Tool> = {
getExchangeRate: {
definition: {
description: "Get the exchange rate from one currency to another.",
parameters: {
from: { required: true, type: "string" },
to: { required: true, type: "string" },
},
strict: true,
},
function: async ({ from, to }: { from: string; to: string }) => {
// Console.log(`getExchangeRate ${from} ${to}`)
const response = await fetch(`https://open.er-api.com/v6/latest/${from}`),
data = await response.json();
return data.rates[to];
},
},
getJoke: {
definition: {
description: "Get a random joke.",
parameters: {},
strict: true,
},
function: async () => {
console.log(`getJoke`);
const response = await fetch("https://official-joke-api.appspot.com/random_joke"),
data = await response.json();
return `${data.setup} ${data.punchline}`;
},
},
getTime: {
definition: {
description: "Get the current server time in ISO format.",
parameters: {},
strict: true,
},
function: async () => {
console.log(`getTime`);
return new Date().toISOString();
},
},
getWeather: {
definition: {
description: "Get current temperature for provided coordinates in celsius.",
parameters: {
latitude: { required: true, type: "number" },
longitude: { required: true, type: "number" },
},
strict: true,
},
function: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
console.log(`getWeather called with ${latitude} ${longitude}`);
const response = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`,
),
data = await response.json();
return data.current.temperature_2m;
},
},
},

result = await ai.run(
"tool-use",
"@OpenAI/gpt-4o:latest",
{
messages: [
{
content:
"What is the weather like in Paris and Kolkata today? Tell me a joke with current time? get the exchange rate of inr to usd",
role: "user",
},
],
stream: false,
tools,
},
(body: object) => {
fs.writeFileSync("./dump-body.json", JSON.stringify(body, undefined, 2));
},
);

console.log({ result: result.content });

---

---

// examples/output-image.ts
import { initAI } from "../src";

const ai = initAI(),

result = await ai.run("image-generation", "@Google/gemini-1.5-flash-8b", {
prompt: "Draw a sky",
});

console.log({ result: result.content });

---

---

// examples/output-text-stream.ts
import { exit } from "node:process";
import fs from "node:fs";
import { initAI, readStream } from "../src";

const ai = initAI(),

result = await ai.run(
"text-generate",
"@X/grok-2:1212",
{
prompt: "Write 1 to 101",
stream: true,
},
(body: object) => {
fs.writeFileSync("./dump-body.json", JSON.stringify(body, undefined, 2));
},
);

if (!(result.content instanceof ReadableStream)) { exit(0); }

readStream(result.content, ({ delta }) => {
process.stdout.write(delta)
})
---------------------------------------------------------

---

// examples/output-text-structured.ts
import { exit } from "node:process";
import { z } from "zod";
import { initAI } from "../src";

const ai = initAI(),

// NOTE: responseSchema should always be and z object
responseSchema = z.object({
timeline: z.array(
z.object({
color: z.string(),
time: z.string().datetime(),
}),
),
}),

result = await ai.run<z.infer<typeof responseSchema>>(
"text-generate",
"@Google/gemini-2.0-flash-lite",
{
format: responseSchema,
prompt: "What is the sky color in every 6 hour",
stream: false,
},
);

if (result.content instanceof ReadableStream) {exit(0);}

console.log({ result: result.content.timeline });

---

---

// oxfmtrc.json
{
"singleQuote": true,
"semi": false,
"printWidth": 200,
"trailingComma": "es5",
"bracketSameLine": true,
"tabWidth": 2,
"useTabs": false,
"endOfLine": "lf",
"ignorePatterns": [".oxlintrc.json", "oxfmtrc.json", ".oxfmtignore"]
}

---

---

// package.json
{
"name": "@shba007/unai",
"version": "0.3.9",
"description": "Unified AI Adapter Library. For Ollama, Gemini, OpenAI, Anthropic, X",
"keywords": [],
"license": "MIT",
"author": "Shirsendu Bairagi <shirsendu2001@gmail.com>",
"repository": {
"type": "git",
"url": "git+https://github.com/shba007/unai.git"
},
"files": [
"dist"
],
"type": "module",
"sideEffects": false,
"main": "./dist/index.cjs",
"module": "./dist/index.mjs",
"types": "./dist/index.d.ts",
"exports": {
".": {
"types": "./dist/index.d.ts",
"import": "./dist/index.mjs",
"require": "./dist/index.cjs"
}
},
"scripts": {
"prepare": "husky || true",
"dev": "dotenvx run -- vitest dev",
"detect": "gitleaks git --verbose",
"lint": "oxlint . --fix",
"format": "oxfmt . --write",
"test:types": "tsc --noEmit --skipLibCheck",
"test": "bun run lint && dotenvx run -- vitest run --coverage",
"play": "dotenvx run -- jiti examples/output-text-structured",
"build": "unbuild",
"prepack": "bun run build",
"clean": "rm -rf coverage dist",
"unai": "dotenvx run -- jiti examples/input-text"
},
"dependencies": {
"confbox": "^0.3.1",
"consola": "^3.4.2",
"file-type": "^22.1.1",
"ofetch": "^1.5.1",
"pathe": "^2.0.3",
"std-env": "^4.3.0",
"unstorage": "^1.17.5",
"zod": "^4.6.5",
"zod-to-json-schema": "^3.25.2"
},
"devDependencies": {
"@commitlint/cli": "^21.2.3",
"@commitlint/config-conventional": "^21.2.3",
"@dotenvx/dotenvx": "^2.33.0",
"@types/node": "^26.6.4",
"@vitest/coverage-v8": "^5.0.3",
"husky": "^9.1.7",
"jiti": "^2.7.0",
"oxfmt": "^0.72.0",
"oxlint": "^1.87.0",
"typescript": "^6.0.3",
"unbuild": "^3.6.1",
"vitest": "^5.0.3"
},
"engines": {
"bun": "^1.2.9",
"node": "^20.15.0 || ^22.11.0",
"pnpm": "^9.15.0 || ^10.2.0"
},
"packageManager": "bun@1.4.2"
}

---

---

// renovate.json
{
"extends": ["github>unjs/renovate-config"]
}

---

---

// src/index.ts
import type { Params, ToolParams } from './types'
import type { AudioTranscribeModel, TextGenerateModel, ToolUseModel } from './tasks'
import { audioTranscribe, textGenerate, toolUse } from './tasks'

type Task = 'text-generate' | 'tool-use' | 'image-generate' | 'audio-generate' | 'video-generate' | 'image-caption' | 'audio-transcribe' | 'video-caption'

interface AIResponse<T> {
content:
| T
| ReadableStream<{
delta: string
total: string
}>
}

export function initAI() {
async function run<T = string>(task: 'text-generate', model: TextGenerateModel, params: Params, debugCallback?: (body: object) => void): Promise<AIResponse<T>>

async function run(task: 'tool-use', model: ToolUseModel, params: Params, debugCallback?: (body: object) => void): Promise<{ content: string }>

async function run(task: 'audio-transcribe', model: AudioTranscribeModel, params: Params, debugCallback?: (body: object) => void): Promise<{ content: string }>

async function run<T = string>(task: Task, model: TextGenerateModel | AudioTranscribeModel, params: Params, debugCallback?: (body: object) => void): Promise<AIResponse<T> | { content: string }> {
switch (task) {
case 'text-generate': {
return textGenerate<T>(model as TextGenerateModel, params, debugCallback)
}
case 'tool-use': {
return toolUse<T>(model as ToolUseModel, params as ToolParams, debugCallback)
}
case 'audio-transcribe': {
return audioTranscribe(model as AudioTranscribeModel, params, debugCallback)
}
default: {
throw new Error(`Invalid task: ${task}`)
}
}
}

return { run }
}

export { default as readStream } from './utils/read-stream'
---------------------------------------------------------

---

// src/models/anthropic.ts
import { $fetch } from "ofetch";
import { env } from "std-env";
import type { DistilledParams } from "../types";

const CLAUDE_BASE_URL = "https://api.openai.com/v1";

export async function anthropic(
model: string,
params: DistilledParams,
debugCallback?: (body: object) => void,
) {
const body = {
model,
stream: params.stream,
/* Format: "json", */
messages: params.messages,
};
if (debugCallback) {debugCallback(body);}

const res = $fetch("/", {
baseURL: CLAUDE_BASE_URL,
body,
headers: {
Authorization: `Bearer ${env.CLAUDE_API_KEY}`,
},
method: "POST",
responseType: params.stream ? "stream" : undefined,
});

return { content: res as unknown as string | ReadableStream<{ delta: string; total: string }> };
}

---

---

// src/models/google.ts
import { $fetch } from "ofetch";
import { env } from "std-env";

import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";

interface GeminiResponse {
candidates: {
content: {
parts: {
text: string;
}[];
role: string;
};
finishReason: string;
avgLogprobs: number;
}[];
usageMetadata: {
promptTokenCount: number;
candidatesTokenCount: number;
totalTokenCount: number;
};
modelVersion: string;
}

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function google(
model: string,
params: DistilledParams,
debugCallback?: (body: object) => void,
) {
const body = {
...(params.format
? {
generationConfig: {
response_mime_type: "application/json",
response_schema: params.format,
},
}
: {}),
contents: [
{
parts: params.messages.map(({ content }) => ({ text: content.text })),
},
],
};
if (debugCallback) { debugCallback(body); }
let status: { code: number; message: string };

const res = $fetch<GeminiResponse | ReadableStream<Uint8Array>>(
`/${model}:${params.stream ? "streamGenerateContent" : "generateContent"}`,
{
baseURL: GEMINI_BASE_URL,
method: "POST",
query: {
key: env.GEMINI_API_KEY,
...(params.stream ? { alt: "sse" } : {}),
},
body,
// @ts-expect-error
responseType: params.stream ? "stream" : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText };
},
},
);

return {
content: await res
.then((data) => {
if (data instanceof ReadableStream) {
let delta: string
let total: string

          return mapStream<{ delta: string; total: string }>(data, (streamData: GeminiResponse) => {
            const value = streamData.candidates.map(({ content }) => content.parts[0].text).at(-1)!
            delta = value
            total = (total ?? '') + value

            return { delta, total }
          })
        } else {
          return data.candidates.map(({ content }) => content.parts[0].text).at(-1)!
        }
      })

}
}
---------------------------------------------------------

---

// src/models/groq.ts
import { $fetch } from "ofetch";
import { env } from "std-env";

import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";
import convertToBase64 from "../utils/convert-to-base64";

interface GroqTextResponse {
id: string;
object: string;
created: number;
model: string;
choices: {
index: number;
delta: { role: string; content: string; refusal: null };
message: { role: string; content: string; refusal: null };
logprobs: null;
finish_reason: string;
}[];
system_fingerprint: string;
usage: {
prompt_tokens: number;
completion_tokens: number;
total_tokens: number;
prompt_tokens_details: {
cached_tokens: number;
audio_tokens: number;
};
completion_tokens_details: {
reasoning_tokens: number;
audio_tokens: number;
accepted_prediction_tokens: number;
rejected_prediction_tokens: number;
};
};
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

async function text(
model: string,
params: DistilledParams,
debugCallback?: (body: object) => void,
) {
const messages = await Promise.all(
params.messages.map(async ({ role, content }) => ({
content: await Promise.all([
{ text: content.text, type: "text" },
...content.images.map(async (url) => (
{
image_url: { url: await convertToBase64(url) },
type: "image_url",
}
)),
]),
role,
})),
),
body = {
model,
stream: params.stream,
...(params.format
? {
response_format: {
json_schema: {
name: "unique_response",
schema: params.format,
strict: true,
},
type: "json_schema",
},
}
: {}),
messages,
};
if (debugCallback) { debugCallback(body); }
let status: { code: number; message: string };

const res = $fetch<GroqTextResponse | ReadableStream<Uint8Array>>("/chat/completions", {
baseURL: GROQ_BASE_URL,
headers: {
Authorization: `Bearer ${env.GROQ_API_KEY}`,
},
method: "POST",
body,
// @ts-expect-error
responseType: params.stream ? "stream" : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText };
},
});

return {
content: await res
.then((data) => {
if (data instanceof ReadableStream) {
let delta: string
let total: string

          return mapStream<{ delta: string; total: string }>(data, (streamData: GroqTextResponse) => {
            const value = streamData.choices.at(-1)!.delta?.content ?? ''
            delta = value
            total = (total ?? '') + value

            return { delta, total }
          })
        } else {
          return data.choices.at(-1)!.message.content
        }
      })

};
}

export { text };

---

---

// src/models/index.ts
export * as ollama from "./ollama";
export * as google from "./google";
export * as openAI from "./open-ai";
export * as perplexity from "./perplexity";
export * as anthropic from "./anthropic";
export * as x from "./x";
export * as groq from "./groq";

---

---

// src/models/ollama.ts
import { $fetch } from "ofetch";
import { env } from "std-env";
import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";

interface OllamaResponse {
model: string;
created_at: string;
message: {
role: string;
content: string;
};
done_reason: string;
done: boolean;
total_duration: number;
load_duration: number;
prompt_eval_count: number;
prompt_eval_duration: number;
eval_count: number;
eval_duration: number;
}

export async function ollama(
model: string,
params: DistilledParams,
debugCallback?: (body: object) => void,
) {
const body = {
model,
stream: params.stream,
...(params.format
? {
format: params.format,
}
: {}),
messages: params.messages,
};
if (debugCallback) { debugCallback(body); }
let status: { code: number; message: string };

const res = $fetch<OllamaResponse | ReadableStream<Uint8Array>>("/api/chat", {
baseURL: env.OLLAMA_BASE_URL ?? "http://localhost:11434",
method: "POST",
body,
// @ts-expect-error
responseType: params.stream ? "stream" : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText };
},
});

return {
content: await res
.then((data) => {
if (data instanceof ReadableStream) {
let delta: string
let total: string

          return mapStream<{ delta: string; total: string }>(data, (streamData: OllamaResponse) => {
            const value = streamData.message.content
            delta = value
            total = (total ?? '') + value

            return { delta, total }
          })
        } else {

          return data.message.content
        }
      })

}
}
---------------------------------------------------------

---

// src/models/open-ai.ts
import { $fetch } from 'ofetch'
import { env } from 'std-env'
import { fileTypeFromBuffer } from 'file-type'

import type { DistilledParams, DistilledToolParams } from '../types'
import mapStream from '../utils/map-stream'
import convertToBase64 from '../utils/convert-to-base64'

interface OpenAITextResponse {
id: string
object: string
created: number
model: string
choices: {
index: number
delta: { role: string; content: string; refusal: null }
message: { role: string; content: string; refusal: null }
logprobs: null
finish_reason: string
}[]
system_fingerprint: string
usage: {
prompt_tokens: number
completion_tokens: number
total_tokens: number
prompt_tokens_details: {
cached_tokens: number
audio_tokens: number
}
completion_tokens_details: {
reasoning_tokens: number
audio_tokens: number
accepted_prediction_tokens: number
rejected_prediction_tokens: number
}
}
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

async function text(model: string, params: DistilledParams, debugCallback?: (body: object) => void) {
const messages = await Promise.all(
params.messages.map(async ({ role, content }) => ({
role,
content: await Promise.all([
content?.text ? { type: 'text', text: content.text } : {},
...(content?.images
? content.images.map(async (url) => {
return {
type: 'image_url',
image_url: { url: await convertToBase64(url) },
}
})
: []),
]),
}))
)

const body = {
model,
stream: params.stream,
...(params.format
? {
response_format: {
type: 'json_schema',
json_schema: {
name: 'unique_response',
strict: true,
schema: params.format,
},
},
}
: {}),
messages,
}
if (debugCallback) debugCallback(body)
let status: { code: number; message: string }

const res = $fetch<OpenAITextResponse | ReadableStream<Uint8Array>>('/chat/completions', {
baseURL: OPENAI_BASE_URL,
headers: {
Authorization: `Bearer ${env.OPENAI_API_KEY}`,
},
method: 'POST',
body,
// @ts-expect-error responseType stream is not typed in ofetch
responseType: params.stream ? 'stream' : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText }
},
})

return {
content: await res
.then((data) => {
if (data instanceof ReadableStream) {
let delta = ''
let total = ''

          return mapStream<{ delta: string; total: string }>(data, (streamData: OpenAITextResponse) => {
            const value = streamData.choices.at(-1)!.delta?.content ?? ''
            delta = value
            total = (total ?? '') + value

            return { delta, total }
          })
        } else {
          return data.choices.at(-1)!.message.content
        }
      })
      .catch((error) => {
        throw new Error(`OpenAI Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`)
      }),

}
}

interface OpenAIToolResponse {
id: string
object: string
created_at: number
status: string
error: null
incomplete_details: null
instructions: null
max_output_tokens: null
model: string
output: {
type: string
id: string
call_id: string
name: string
arguments: string
status: string
}[]
parallel_tool_calls: boolean
previous_response_id: null
reasoning: {
effort: null
generate_summary: null
}
store: boolean
temperature: number
text: {
format: {
type: string
}
}
tool_choice: string
tools: {
type: 'function'
name: string
description: string
parameters: {
type: string
properties: {
[key: string]: {
type: string
}
}
required: string[]
additionalProperties: boolean
}
strict: boolean
}[]
top_p: number
truncation: string
usage: {
input_tokens: number
input_tokens_details: {
cached_tokens: number
}
output_tokens: number
output_tokens_details: {
reasoning_tokens: number
}
total_tokens: number
}
user: null
metadata: Record<string, any>
}

export interface OpenAIToolCall {
type: 'function_call'
id: string
call_id: string
name: string
arguments: string
status: string
}

async function tool(model: string, params: DistilledToolParams, debugCallback?: (body: object) => void) {
const messages = await Promise.all(
params.messages.map(async ({ role, content, type, call_id, id, name, arguments: args, status, output }) =>
role
? {
role,
content: content?.text ?? content,
}
: {
type,
id,
call_id,
name,
arguments: args,
status,
output,
}
)
)

const isToolCall = params.tools !== undefined

const body = isToolCall
? {
model,
stream: params.stream,
input: messages.map(({ role, content, type, call_id, id, name, arguments: args, status, output }) => (role ? { role, content } : { type, call_id, id, name, arguments: args, status, output })),
tools: Object.entries(params.tools).map(([name, toolItem]) => {
const { description, parameters, strict } = toolItem.definition

        const properties: Record<string, { type: string }> = {}
        for (const paramKey of Object.keys(parameters)) {
          properties[paramKey] = { type: parameters[paramKey].type }
        }

        const required = Object.keys(parameters).filter((paramKey) => parameters[paramKey].required)

        return {
          type: 'function',
          name,
          description,
          parameters: {
            type: 'object',
            properties,
            required,
            additionalProperties: false,
          },
          strict,
        }
      }),
    }
    : {
      model,
      stream: params.stream,
      ...(params.format
        ? {
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'unique_response',
              strict: true,
              schema: params.format,
            },
          },
        }
        : {}),
      input: messages,
    }

if (debugCallback) debugCallback(body)
let status: { code: number; message: string }

const res = $fetch<OpenAIToolResponse | ReadableStream<Uint8Array>>('/responses', {
baseURL: OPENAI_BASE_URL,
headers: {
Authorization: `Bearer ${env.OPENAI_API_KEY}`,
},
method: 'POST',
body,
// @ts-expect-error responseType stream is not typed in ofetch
responseType: params.stream ? 'stream' : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText }
},
})

return {
content: await res
.then((data) => {
if (data instanceof ReadableStream) {
let delta = ''
let total = ''

          return mapStream<{ delta: string; total: string }>(data, (streamData: OpenAIToolResponse) => {
            const value = streamData.choices.at(-1)!.delta?.content ?? ''
            delta = value
            total = (total ?? '') + value

            return { delta, total }
          })
        } else {
          return 'output' in data ? data.output : []
        }
      })
      .catch((error) => {
        throw new Error(`OpenAI Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`)
      }),

}
}

interface OpenAIAudioResponse {
text: string
}

async function audioTranscribe(model: string, params: DistilledParams, debugCallback?: (body: object) => void) {
const buffer = Buffer.from(params.messages.at(-1)!.content.audios.at(-1)!)
const fileType = await fileTypeFromBuffer(buffer)
const blob = new Blob([buffer], { type: fileType?.mime })

const body = new FormData()
body.append('file', blob)
body.append('model', model)

if (debugCallback) debugCallback(body)

const res = $fetch<OpenAIAudioResponse>('/audio/transcriptions', {
baseURL: OPENAI_BASE_URL,
headers: {
Authorization: `Bearer ${env.OPENAI_API_KEY}`,
},
method: 'POST',
body,
onResponseError({ response }) {
throw new Error(`OpenAI Fetch Failed ${response.status} ${response.statusText}`)
},
})

return {
content: await res.then((data) => {
return data.text
}),
}
}

async function audioGenerate(model: string, params: DistilledParams, debugCallback?: (body: object) => void) {
const persona = 'alloy'
const body = {
model,
input: params.messages.at(-1),
voice: persona,
}

if (debugCallback) debugCallback(body)

const res = $fetch<ArrayBuffer>('/audio/speech', {
baseURL: OPENAI_BASE_URL,
method: 'POST',
headers: {
Authorization: `Bearer ${env.OPENAI_API_KEY}`,
},
body,
responseType: 'arrayBuffer',
})

return {
content: await res.then((data) => {
return data
}),
}
}

export { text, tool, audioTranscribe, audioGenerate }
---------------------------------------------------------

---

// src/models/perplexity.ts
import { $fetch } from "ofetch";
import { env } from "std-env";

import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";

const PERPLEXITY_BASE_URL = "https://api.perplexity.ai";

export interface PerplexityResponse {
id: string;
model: string;
created: number;
usage: {
prompt_tokens: number;
completion_tokens: number;
total_tokens: number;
};
citations: string[];
object: string;
choices: {
index: number;
finish_reason: string;
message: Delta;
delta: Delta;
}[];
}

export interface Delta {
role: string;
content: string;
}

export async function perplexity(
model: string,
params: DistilledParams,
debugCallback?: (body: object) => void,
) {
const body = {
messages: params.messages.map(({ role, content }) => ({ content: content.text, role })),
model,
stream: params.stream,
};
if (debugCallback) { debugCallback(body); }
let status: { code: number; message: string };

const res = $fetch<PerplexityResponse | ReadableStream<Uint8Array>>("/chat/completions", {
baseURL: PERPLEXITY_BASE_URL,
headers: {
Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
},
method: "POST",
body,
// @ts-expect-error
responseType: params.stream ? "stream" : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText };
},
});

return {
content: await res

      .then((data) => {
        if (data instanceof ReadableStream) {
          let delta: string
          let total: string

          return mapStream<{ delta: string; total: string }>(data, (streamData: PerplexityResponse) => {
            const value = streamData.choices.at(-1)!.delta?.content ?? ''
            delta = value
            total = (total ?? '') + value

            return { delta, total }
          })
        } else {

          return data.choices.at(-1)!.message.content
        }
      })

};
}

---

---

// src/models/x.ts
import { $fetch } from "ofetch";
import { env } from "std-env";

import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";
import convertToBase64 from "../utils/convert-to-base64";

interface XTextResponse {
id: string;
object: string;
created: number;
model: string;
choices: {
index: number;
delta: { role: string; content: string; refusal: null };
message: { role: string; content: string; refusal: null };
logprobs: null;
finish_reason: string;
}[];
system_fingerprint: string;
usage: {
prompt_tokens: number;
completion_tokens: number;
total_tokens: number;
prompt_tokens_details: {
cached_tokens: number;
audio_tokens: number;
};
completion_tokens_details: {
reasoning_tokens: number;
audio_tokens: number;
accepted_prediction_tokens: number;
rejected_prediction_tokens: number;
};
};
}

const X_BASE_URL = "https://api.x.ai/v1";

async function text(
model: string,
params: DistilledParams,
debugCallback?: (body: object) => void,
) {
const messages = await Promise.all(
params.messages.map(async ({ role, content }) => ({
content: await Promise.all([
{ text: content.text, type: "text" },
...content.images.map(async (url) => (
{
image_url: { url: await convertToBase64(url) },
type: "image_url",
}
)),
]),
role,
})),
),
body = {
model,
stream: params.stream,
...(params.format
? {
response_format: {
json_schema: {
name: "unique_response",
schema: params.format,
strict: true,
},
type: "json_schema",
},
}
: {}),
messages,
};
if (debugCallback) {debugCallback(body);}
let status: { code: number; message: string };

const res = $fetch<XTextResponse | ReadableStream<Uint8Array>>("/chat/completions", {
baseURL: X_BASE_URL,
headers: {
Authorization: `Bearer ${env.X_API_KEY}`,
},
method: "POST",
body,
// @ts-expect-error
responseType: params.stream ? "stream" : undefined,
onResponseError({ response }) {
status = { code: response.status, message: response.statusText };
},
});

return {
content: await res
.then((res) => {
if (res instanceof ReadableStream) {
let delta: string,
total: string;

          return mapStream<{ delta: string; total: string }>(res, (data: XTextResponse) => {
            // Consola.log({ choices: data.choices.at(-1) })
            const value = data.choices.at(-1)!.delta?.content ?? "";
            // Consola.log({ value })
            delta = value;
            total = (total ?? "") + value;

            return { delta, total };
          });
        }
          // Consola.log({ input: params.messages, output: res.choices[0].message.content })
          return res.choices.at(-1)!.message.content;

      })
      .catch((error) => {
        throw new Error(
          `X Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`,
        );
      }),

};
}

export { text };

---

---

// src/storage.ts
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

export const storage = createStorage({
driver: fsDriver({ base: "." }), // Specify your base path
});

---

---

// src/types/index.ts
export type Role = "system" | "user" | "developer" | "assistant";

export interface Tool {
definition: {
description: string;
parameters: Record<string, { type: string; required: boolean }>;
strict: boolean;
};
function: (...args: any[]) => Promise<any>;
}

export interface BasicMessage {
role: Role;
content: string;
}

export interface DetailedMessage {
role?: Role;
content?: { audios?: (string | Buffer<ArrayBufferLike>)[]; text?: string; images?: string[] };
}

export interface BaseParams {
stream?: boolean;
format?: object;
}

export interface PromptParams extends BaseParams {
prompt: string; // Only prompt is allowed
messages?: never;
}

export interface MessageParams extends BaseParams {
prompt?: never;
messages: (BasicMessage | DetailedMessage)[]; // Only messages are allowed
}

export interface ToolParams extends BaseParams {
prompt?: string;
messages: BasicMessage[]; // Only messages are allowed
tools: Record<string, Tool>;
}

export type Params = PromptParams | MessageParams | ToolParams;

export interface DistilledDetailedMessage {
role: Role;
content: { audios: Buffer<ArrayBufferLike>[]; text: string; images: string[] };
}

export interface DistilledParams {
stream: boolean;
messages: DistilledDetailedMessage[];
format: any;
tools: Record<string, Tool>;
}

export interface DistilledToolMessage {
role?: Role;
content?: { text?: string };
type?: "function_call" | "function_call_output";
call_id: string;
output: string;
}

export interface DistilledToolParams {
stream: boolean;
messages: DistilledToolMessage[];
format: any;
tools: Record<string, Tool>;
}

---

---

// src/utils/convert-to-base64.ts
import { $fetch } from 'ofetch'
import pathe from 'pathe'
import { storage } from '../storage'

const getBufferPrefix = (mimeType: string) => `data:${mimeType};base64,`

/**

- Converts a file path or URL to a Base64-encoded string.
- @param path - The file path or URL.
- @param convertUrl - Whether to convert URLs to Base64. Defaults to true.
- @returns A promise that resolves to the Base64-encoded string.
  */
  export default async function (path: string, convertUrl = true): Promise<string> {
  try {
  if (path.startsWith('file://')) {
  const filePath = path.slice(7)
  const fileBuffer = (await storage.getItemRaw(pathe.resolve(filePath))) as ArrayBuffer
  if (!fileBuffer) {
  throw new Error(`File not found: ${filePath}`)
  }
  const mimeType = 'image/jpeg'
  return getBufferPrefix(mimeType) + Buffer.from(fileBuffer).toString('base64')
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
  if (!convertUrl) return path
  const response = await $fetch(path, { responseType: 'arrayBuffer' })
  const buffer = Buffer.from(response)
  const mimeType = 'image/jpeg'
  return getBufferPrefix(mimeType) + buffer.toString('base64')
  } else {
  throw new Error('Invalid path: must start with "file://", "http://", or "https://".')
  }
  } catch (error: any) {
  throw new Error(`Failed to convert to Base64: ${error.message}`, { cause: error })
  }
  }

---

---

// src/utils/format-json-schema.ts
export default function formatJSONSchema(model: 'Ollama' | 'Google' | 'OpenAI', obj: object | string): any {
if (typeof obj === 'string') {
return model === 'Google' ? obj.toUpperCase() : obj
}

if (Array.isArray(obj)) {
return obj.map((item) => formatJSONSchema(model, item))
}

if (typeof obj === 'object' && obj !== null) {
const updatedObj = {}
for (const key in obj) {
if ((model === 'Google' && (key === 'required' || key === 'additionalProperties')) || key === '$schema' || key === 'format' || key === 'minLength') {
continue
}
// @ts-expect-error dynamic property assignment
updatedObj[key] = formatJSONSchema(model, obj[key])
}
return updatedObj
}

return obj
}
---------------------------------------------------------

---

// src/utils/map-stream.ts
export default function <T>(stream: ReadableStream<Uint8Array>, mapFunction: (value: any) => T) {
const reader = stream.getReader(),
decoder = new TextDecoder();
let partialData = ""; // Buffer to hold incomplete chunks

return new ReadableStream<T>({
async start(controller) {
while (true) {
const { done, value } = await reader.read();
if (done) {
// Process any remaining buffered data
if (partialData.trim().length > 0) {
processAndEnqueue(partialData, controller);
}
controller.close();
break;
}

        // Append new decoded text to the buffer
        partialData += decoder.decode(value, { stream: true });

        // Split into complete parts; last part may be incomplete
        const parts = partialData.split(/\r\n|\n\n/);
        partialData = parts.pop() ?? "";

        for (const chunk of parts) {
          processAndEnqueue(chunk, controller);
        }
      }
    },

});

function processAndEnqueue(chunk: string, controller: ReadableStreamDefaultController<T>) {
// Ensure the chunk has the expected prefix length
if (chunk.length <= 6) {return;}
try {
// Remove the prefix (e.g. "data: ") and parse JSON
const parsedChunk = JSON.parse(chunk.slice(6)) as T,
mappedChunk = mapFunction(parsedChunk);
if (mappedChunk) {controller.enqueue(mappedChunk);}
} catch {
// Optionally log or handle parsing errors here
}
}
}

---

---

// src/utils/read-stream.ts
export default function <T>(stream: ReadableStream<T>, readFunction: (value: T) => void) {
return new Promise<void>((resolve) => {
const reader = stream.getReader();

    reader
      .read()
      .then(function processText({ done, value }): any {
        if (done) {
          return;
        }

        readFunction(value);

        return reader.read().then(processText);
      })
      .finally(() => {
        resolve();
      });

});
}

---

---

// tests/index.test.ts
import { describe, expect, test } from "vitest";
import { initAI } from "../src";

describe("Text Generate", () => {
const ai = initAI();

test("Sanity Test", async () => {
expect(true).toBe(true);
});

/* Test('Ollama', async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run(
'text-generate',
'@Ollama/Meta/llama3.2:3b',
{
messages: [
{
role: 'system',
content: 'reply in one word',
},
{
role: 'user',
content: 'What is the tree color',
},
{
role: 'assistant',
content: 'Green',
},
{
role: 'user',
content: 'What is the sky color',
},
],
}
);

      expect(result).toHaveProperty('content');
      expect(result.content).toMatch(/blue/i);

      console.log({ result: result.content });
    }); */

test("Gemini", async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run("text-generate", "@Google/gemini-1.5-flash-8b", {
messages: [
{
content: "reply in one word",
role: "system",
},
{
content: "What is the tree color",
role: "user",
},
{
content: "Green",
role: "assistant",
},
{
content: "What is the sky color",
role: "user",
},
],
});

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });

});

test("OpenAI", async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run("text-generate", "@OpenAI/o3-mini:latest", {
messages: [
{
content: "reply in one word",
role: "system",
},
{
content: "What is the tree color",
role: "user",
},
{
content: "Green",
role: "assistant",
},
{
content: "What is the sky color",
role: "user",
},
],
});

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });

});

test("Perplexity", async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run("text-generate", "@Perplexity/sonar", {
messages: [
{
content: "reply in one word",
role: "system",
},
{
content: "What is the tree color",
role: "user",
},
{
content: "Green",
role: "assistant",
},
{
content: "What is the sky color",
role: "user",
},
],
});

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });

});

/*Test('Anthropic', async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run(
'text-generate',
'@X/grok-2:1212',
{
messages: [
{
role: 'system',
content: 'reply in one word',
},
{
role: 'user',
content: 'What is the tree color',
},
{
role: 'assistant',
content: 'Green',
},
{
role: 'user',
content: 'What is the sky color',
},
],
}
);

     expect(result).toHaveProperty('content');
     expect(result.content).toMatch(/blue/i);

     console.log({ result: result.content });

});*/

test("Grok", async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run("text-generate", "@X/grok-2:1212", {
messages: [
{
content: "reply in one word",
role: "system",
},
{
content: "What is the tree color",
role: "user",
},
{
content: "Green",
role: "assistant",
},
{
content: "What is the sky color",
role: "user",
},
],
});

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });

});

test("Groq", async () => {
// Run the AI text generation with a set of messages.
const result = await ai.run("text-generate", "@Groq/llama3-70b-8192", {
messages: [
{
content: "What is the tree color",
role: "user",
},
{
content: "Green",
role: "assistant",
},
{
content: "What is the sky color",
role: "user",
},
],
});

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });

});
});

---
