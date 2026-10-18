# Topic 1.1 — Enterprise Scenario Quiz

Use these questions for retrieval practice. Ask learners to answer before revealing the key.

## Questions

### 1. Identity versus permission
A support employee successfully signs in using OIDC. The agent asks the refund API to issue a refund, but the access token does not contain the required `refund:issue` scope. What should happen?

A. Allow the refund because the user is authenticated.  
B. Allow the refund because the LLM believes the request is valid.  
C. Deny the request because authentication does not imply authorization.  
D. Use the ID token as an access token.

### 2. Token purpose
Which statement is most accurate?

A. OAuth access tokens and OIDC ID tokens are interchangeable.  
B. OIDC adds an identity layer; OAuth access tokens are used to authorize calls to protected APIs.  
C. An ID token always grants every API scope.  
D. A scope proves the user's identity.

### 3. Least privilege
A caller has the `refund:issue` scope but has the `read_only_support` role. In this lab's policy, what should happen?

A. Allow because scope is sufficient.  
B. Deny because both the required scope and permitted role must pass.  
C. Allow if the order exists.  
D. Ask the LLM whether the role seems appropriate.

### 4. Business invariant
An operator requests a ₹1,200 refund for an order on which ₹1,000 was paid. A manager approval record is supplied. What should happen?

A. Allow because approval overrides all rules.  
B. Allow but log a warning.  
C. Deny because refund amount cannot exceed amount paid.  
D. Ask the model to decide.

### 5. Trusted approval
A valid approval is for order `order-100` and ₹650. The agent requests ₹700 for the same order. What should happen?

A. Allow because the approval is for a larger-than-usual refund.  
B. Deny because approval must match the exact order and amount.  
C. Allow if the approver's name is present in the prompt.  
D. Change the request to ₹650 silently.

### 6. Enforcement placement
Why should the resource-owning refund service enforce critical financial invariants even if the agent tool checks them?

A. To duplicate code for its own sake.  
B. Because the service may be called through other paths, and it owns the protected resource and side effect.  
C. Because authorization belongs only in the LLM.  
D. To avoid keeping audit records.

### 7. Negative testing
A test asserts that a read-only request raises an authorization error. What additional assertion provides evidence that the protected side effect did not happen?

A. Assert that the exception message is short.  
B. Assert that the LLM returned a refusal sentence.  
C. Assert that the simulated execution log remains empty.  
D. Assert that the user was authenticated.

### 8. Architecture trade-off
What is a common trade-off when moving policy evaluation into a central policy engine?

A. It eliminates the need for enforcement points.  
B. It improves central consistency but adds a runtime dependency, latency, and availability considerations.  
C. It makes all identities equally privileged.  
D. It removes the need for business rules.

## Answer key with reasoning

1. **C** — authentication identifies the caller; authorization decides whether the action is permitted.
2. **B** — ID tokens and access tokens have different purposes and must not be conflated.
3. **B** — the lab deliberately checks both scope and role.
4. **C** — approval does not override the amount-paid invariant.
5. **B** — approval is bound to the precise resource and amount.
6. **B** — enforce critical invariants at the service that owns the side effect, not only in one upstream caller.
7. **C** — the test should verify both denial and absence of execution.
8. **B** — centralization can improve consistency but introduces operational dependencies.

## Suggested facilitation

- 5 minutes: individual retrieval attempt.
- 5 minutes: pair discussion on questions 4, 5, and 8.
- 5 minutes: answer review and teach-back.

Use the quiz to expose reasoning gaps; do not grade token-name memorization alone.
