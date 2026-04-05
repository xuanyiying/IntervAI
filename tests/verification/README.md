# Core Functionality Verification System

This directory contains the comprehensive verification system for Interview AI's eight core modules.

## Structure

```
tests/verification/
├── config/              # Test configuration files
├── fixtures/            # Test data and fixtures
├── helpers/             # Test utility functions
├── modules/             # Module-specific verifiers
├── reports/             # Generated test reports
└── setup/               # Test environment setup
```

## Usage

```bash
# Run all verification tests
pnpm test:verification

# Run specific module tests
pnpm test:verification:auth
pnpm test:verification:resume

# Generate verification report
pnpm test:verification:report
```

## Environment Setup

Tests can run in three modes:

- `test`: Isolated test environment with test database
- `staging`: Staging environment for integration testing
- `production`: Production environment (read-only checks)

Configure the environment in `config/test.config.ts`.
