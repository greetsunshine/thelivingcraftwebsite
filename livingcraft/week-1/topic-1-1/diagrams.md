# Topic 1.1 — Editable Architecture Diagrams

These diagrams are source artifacts. Keep labels and arrows technically precise. OIDC establishes identity context; OAuth access tokens authorize calls to protected APIs. A diagram must not imply that an ID token is used as an API access token.

## Diagram A — Identity and API authorization

```mermaid
flowchart TD
    U[User / operator] --> C[Client application]
    C -->|OIDC authentication request| OP[Identity Provider]
    OP -->|ID token: authentication claims| C
    C -->|OAuth authorization request| AS[Authorization Server]
    AS -->|Access token with granted scopes| C
    C -->|API request + access token| API[Protected Agent Tool API]
    API --> VAL[Validate token and establish trusted principal]
    VAL --> AUTH[Check role, scope, and resource access]
    AUTH -->|Allowed| POLICY[Business policy and approval checks]
    AUTH -->|Denied| DENY[Reject request]
    POLICY -->|Valid| EXEC[Execute protected action]
    POLICY -->|Invalid / approval missing| STOP[Reject or request approval]
```

Teaching notes:
- OIDC ID tokens tell the client about the authenticated user; they are not interchangeable with access tokens.
- OAuth access tokens are presented to protected APIs and must be validated according to the issuer's contract.
- Scopes are one input to authorization, not a complete policy by themselves.
- A trusted principal must be created by the application/authentication layer, not by the LLM.

## Diagram B — Policy enforcement and safe execution

```mermaid
flowchart TD
    A[Agent proposes tool call] --> B[Tool boundary receives request]
    B --> C[Resolve trusted caller identity]
    C --> D{Role and scope allowed?}
    D -->|No| X[Reject: authorization failure]
    D -->|Yes| E{Caller may access this order?}
    E -->|No| X
    E -->|Yes| F{Amount valid and <= amount paid?}
    F -->|No| Y[Reject: business rule failure]
    F -->|Yes| G{Amount > ₹500?}
    G -->|No| H[Execute protected refund]
    G -->|Yes| I{Trusted approval matches order + amount?}
    I -->|No| J[Stop / request approval]
    I -->|Yes| H
    H --> K[Audit result]
    X --> K
    Y --> K
    J --> K
```

Teaching notes:
- The policy decision and policy enforcement can be logically separated, but enforcement must be unavoidable.
- A central policy engine can improve consistency and manageability; it also adds latency, availability, and operational dependencies.
- The resource-owning service should independently enforce critical invariants.
- Approval must come from a trusted workflow and be bound to the specific action.
- Production systems also need appropriate transaction semantics, durable audit, and idempotency controls.
