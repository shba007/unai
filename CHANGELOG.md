# Changelog

# unai

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
