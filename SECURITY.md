# Security Policy

## Supported Versions

We actively maintain the latest version of UsedIt with security patches and bug fixes.

| Version | Supported          |
| :---    | :---:              |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The safety and privacy of our users are of paramount importance. Because UsedIt runs local LLM models and handles user authentication, we take security reports seriously.

### Responsible Disclosure Process

1. **Do NOT open a public GitHub issue** for sensitive security vulnerabilities.
2. Please report security vulnerabilities privately via [GitHub Security Advisories](https://github.com/JohnChuhengYu/UsedIt/security/advisories) or contact the project maintainer directly.
3. Include the following details in your report:
   - A description of the vulnerability and its potential impact.
   - Step-by-step instructions or proof-of-concept (PoC) to reproduce the issue.
   - Any suggested mitigations or patches if available.

### What to Expect

* **Initial Response**: Within 48 hours, acknowledging receipt of your report.
* **Assessment & Fix**: We will assess the severity, verify the exploit, and work on a fix in a private branch.
* **Public Release & Credit**: Once a patch is released, we will publish a security advisory and credit you for the responsible disclosure (unless you prefer anonymity).

---

## Local AI Security & Data Privacy

* **Zero Cloud Data Transmission**: By default, UsedIt communicates exclusively with your local Ollama instance (`http://localhost:11434`). No prompt text, sentences, or vocabulary lists are sent to third-party AI APIs.
* **JWT & Passwords**: Passwords stored in SQLite are cryptographically hashed using `bcrypt`. JWT tokens are signed using a user-configurable secret (`JWT_SECRET_KEY`). Remember to change `JWT_SECRET_KEY` and `SESSION_SECRET` in your `.env` for production environments.

