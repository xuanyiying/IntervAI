# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-17

### Added
- **AI Agents**: Introduced three core agents: Pitch Perfect, Strategist, and Role-Play.
- **Resume Parsing**: Enhanced PDF/DOCX parsing with specialized extractors.
- **Deployment**: Unified deployment scripts (`deploy.sh`) for dev and prod environments.
- **Monitoring**: Integrated Prometheus and Grafana for system observability.

### Changed
- **Documentation**: Restructured documentation into `docs/` directory with clear categories (Guide, Architecture, Technical).
- **API**: Standardized API response format and error handling with `/api/v1` prefix.

### Fixed
- Resolved path issues in deployment scripts.
- Fixed environment variable loading for Docker Compose.
