---
description: Run lint, typecheck, and tests together.
agent: build
---

Run the full validation suite:

1. Type check:
```bash
npx tsc --noEmit
```

2. Lint:
```bash
bun run lint --fix
```

3. Tests:
```bash
bun run test:run
```

Report summary of all results.
