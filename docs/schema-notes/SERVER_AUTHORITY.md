# Server Authority and Anti-Cheat Notes

## Principle

The React client is a renderer and input device, not a trusted rules engine.

Client-side convenience validation is fine for UX, but never sufficient for legality.

## Never send to the client

Until revealed by game rules, avoid transmitting:

- opponent hand contents,
- exact opponent deck order,
- unrevealed ticket Faults,
- server-only random seeds,
- unrevealed test outcomes,
- hidden scenario branches,
- hidden card identity,
- internal scoring modifiers.

CSS hiding, disabled UI elements, obfuscated JavaScript, and encrypted-looking IDs do not protect information already delivered to the browser.

## Recommended request pattern

```text
Client:
    "I want to play card instance C17 on ticket T4."

Server:
    Authenticate player.
    Load authoritative match.
    Validate expected revision.
    Validate C17 is actually in that player's hand.
    Validate turn and action cost.
    Validate T4 is a legal target.
    Resolve card effects using hidden server state.
    Persist state transactionally.
    Increment revision.
    Return public and private deltas/views.
```

## Idempotency

`request_id` and/or `client_nonce` should be tracked server-side so retrying a request cannot resolve the same move twice.

## Randomness

All meaningful randomness should be generated server-side.

## Search encyclopedia vs match secrets

The public technical encyclopedia may expose domain knowledge such as:

- "Failed DIMMs can cause no POST."
- "Memory diagnostics provide evidence about DIMM faults."

That is different from exposing:

- "The active ticket's hidden root fault is Failed DIMM."

The first is study/reference knowledge.
The second is match-secret state.
