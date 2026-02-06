# CLAUDE.md — AI Assistant Guide for context-swapper

## Project Overview

**context-swapper** is a CLI tool that converts AI conversation exports between different providers (e.g., ChatGPT → Claude, Claude → ChatGPT). It enables users to migrate their conversation history across AI platforms.

## Repository Status

This is a greenfield project. The repository is being bootstrapped — the sections below describe the intended structure and conventions to follow as the codebase is built out.

## Tech Stack (Planned)

- **Language:** Node.js / TypeScript (or Python — to be determined by initial implementation)
- **Type:** CLI application
- **Package manager:** npm or yarn (Node.js) / pip (Python)

## Project Structure (Planned)

```
context-swapper/
├── CLAUDE.md              # This file — AI assistant guide
├── README.md              # User-facing documentation
├── package.json           # Project metadata and scripts (if Node.js)
├── tsconfig.json          # TypeScript config (if TypeScript)
├── src/                   # Source code
│   ├── index.ts           # CLI entry point
│   ├── parsers/           # Input format parsers (ChatGPT, Claude, etc.)
│   ├── formatters/        # Output format writers
│   ├── types/             # Type definitions for conversation schemas
│   └── utils/             # Shared utilities
├── tests/                 # Test files
├── .eslintrc.*            # Linting configuration
├── .prettierrc            # Formatting configuration
└── .github/
    └── workflows/         # CI/CD pipelines
```

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Run the CLI
npm start -- --from chatgpt --to claude input.json

# Run in development mode
npm run dev
```

### Common Commands

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm test`       | Run the test suite             |
| `npm run lint`   | Run linter                     |
| `npm run build`  | Compile TypeScript (if applicable) |
| `npm start`      | Run the CLI                    |

### Testing

- Place test files in `tests/` or co-locate as `*.test.ts` next to source files
- Run tests before committing: `npm test`
- Aim for coverage on parsers and formatters — these are the core logic

### Linting & Formatting

- Follow the project's ESLint and Prettier configs
- Run `npm run lint` before committing
- Do not disable lint rules inline without a clear justification

## Key Concepts

### Conversation Schema

The core data model is a **normalized conversation format** that acts as an intermediate representation:

- **Conversation**: Contains metadata (title, create time) and a list of messages
- **Message**: Contains role (user/assistant/system), content, and timestamp
- **Content**: Text blocks, code blocks, or other media references

### Parsers

Each input format (ChatGPT export, Claude export, etc.) has a dedicated parser that converts the provider-specific format into the normalized schema.

### Formatters

Each output format has a formatter that takes the normalized schema and produces the target provider's format.

### Adding a New Provider

1. Create a parser in `src/parsers/<provider>.ts`
2. Create a formatter in `src/formatters/<provider>.ts`
3. Register both in the CLI argument handling
4. Add tests for both parser and formatter

## Conventions for AI Assistants

### Code Style

- Keep functions small and focused
- Use descriptive variable names — no abbreviations
- Prefer explicit error handling over silent failures
- Type all function parameters and return values (if TypeScript)

### Commit Messages

- Use conventional commit format: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Keep the subject line under 72 characters
- Reference issue numbers when applicable

### What NOT to Do

- Do not add unnecessary abstractions or over-engineer
- Do not add dependencies without clear justification
- Do not modify CI/CD configs without being asked
- Do not introduce breaking changes to the CLI interface without discussion
- Do not commit generated files, build artifacts, or secrets

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a summary of what changed and why
- Ensure tests pass and linting is clean before requesting review
