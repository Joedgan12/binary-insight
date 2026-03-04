# Security & Coding Ethics Guidelines

## Overview
Binary Insight follows industry best practices for secure code and data protection.

---

## Frontend Security

### ✅ No Hardcoded Secrets
- **API Keys**: All API keys and credentials are managed server-side (Rust backend)
- **Passwords**: No passwords stored in frontend code or localStorage
- **Tokens**: Authentication tokens are never exposed to client-side code

### ✅ All API Calls Routed Through Backend
- **Frontend → Tauri Backend (IPC)**: Secure inter-process communication
- **Backend → External APIs**: All external API calls (Ollama, etc.) happen server-side
- **No Direct HTTP Calls**: Frontend never makes direct HTTP requests to external services

### ✅ Sensitive Data Protection
- **Environment Variables**: All `.env` files excluded from git
- **User Data**: File contents handled through memory-safe Rust backend
- **Network Packets**: PCAP data processed server-side with secure parsing

---

## Backend Security (Rust)

### ✅ Configurable Endpoints
- **Ollama Client**: Uses configurable `base_url` (default: `http://localhost:11434`)
- **No API Keys**: Ollama runs locally without authentication by default
- **Environment-Driven Config**: Server reads from environment, not hardcoded values

### ✅ Data Handling
- **Memory Safety**: All binary parsing uses safe Rust (memmap2, nom combinators)
- **Buffer Overflows**: Prevented by Rust's type system
- **SQL Injection**: Prepared statements via `rusqlite`

---

## .gitignore Configuration

Properly excludes:
- `src-tauri/target/` - Build artifacts
- `.env` & `.env.local` - Environment secrets
- `*.pem`, `*.key`, `*.crt` - Certificate files
- `Cargo.lock` - Dependency lock (can expose versions)
- Database files - `binary_insight.db`, `*.db-journal`
- IDE settings that might contain local paths

---

## Development Best Practices

1. **Never commit secrets**: All `.env` files are gitignored
2. **Server-side validation**: All user input validated on backend
3. **Principle of Least Privilege**: Frontend only has access to necessary Tauri commands
4. **Secure by default**: Local Ollama endpoint, no cloud dependencies
5. **Code review**: All changes follow TypeScript and Rust best practice patterns

---

## User Privacy

- **Local Processing**: All data analysis happens on user's machine
- **No Telemetry**: No tracking or external communication without explicit user action
- **File Access**: User controls which files are opened (secure file dialogs)
- **Session Management**: Sessions stored in local SQLite database

---

## Deployment Checklist

Before production release:
- [ ] All `.env` files removed from repository
- [ ] No console.log() statements with sensitive data
- [ ] All API endpoints use HTTPS (for cloud deployments)
- [ ] Database backups are encrypted
- [ ] Build artifacts not included in distribution

---

## Reporting Security Issues

If you discover a security vulnerability, please report it to the maintainers privately before public disclosure.

---

**Last Updated**: March 4, 2026  
**Status**: ✅ Passed Security Audit
