---
description: Generate and run database migrations.
agent: build
---

Generate and run database migrations:

1. Generate migration files:
```bash
bun run db:generate
```

2. Review generated SQL in `drizzle/` folder

3. Apply migrations:
```bash
bun run db:migrate
```

Report the migration results and any issues.
