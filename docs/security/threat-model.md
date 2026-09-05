# Initial threat model

| Threat                              | Implemented defense                                                                                          | Remaining work                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Guessed tenant/resource identifiers | Membership lookup, tenant predicates, composite foreign keys, negative API/SQL tests                         | RLS evaluation and broader automated query-boundary checks        |
| Viewer mutates an order             | Backend role check before mutation                                                                           | Finer permission policies as domains grow                         |
| Session theft or fixation           | Cryptographically random token, stored hash, HttpOnly cookie, expiry and revocation; fresh token on login    | Session management UI, recovery, SSO, device controls             |
| Password guessing                   | Argon2id, same verification path for unknown account, per-IP login limit                                     | Distributed limit when scaling API processes                      |
| Cross-site request forgery          | Exact configured Origin plus required custom header for unsafe methods; SameSite cookie                      | HTTPS/reverse-proxy deployment verification                       |
| SQL injection                       | Parameterized values, validated pagination, no caller-supplied SQL sort fragments                            | Continued review of new queries                                   |
| Duplicate financial side effects    | Durable checkout/provider idempotency and fenced worker outcome                                              | Real signed webhooks, reconciliation and ledger                   |
| Unauthorized failure injection      | Admin policy, tenant scope, five-minute expiry, backend configuration gate; production rejects enabled chaos | Additional fault adapters and production deployment tests         |
| Sensitive log exposure              | No request-body logging; cookies/authorization/set-cookie redacted                                           | Central retention, access policy and audit immutability           |
| Browser XSS                         | React escaping, no raw user HTML rendering                                                                   | Production CSP/nonces and upload security when attachments arrive |

Local seed data and credentials are synthetic. Do not put real personal or payment data into the demo. The app stores a synthetic customer name and email per order; retention/deletion policy is not implemented yet.

The initial database role is a developer-owned schema role. Production requires separate migration and least-privilege runtime roles. The simulator and its control tables are local learning infrastructure. No external notifications, carrier requests or payment settlement occur.
