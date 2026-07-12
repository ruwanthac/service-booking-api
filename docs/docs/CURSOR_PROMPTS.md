# Cursor Prompt Template

Before generating code:

1. Read docs/PROJECT_RULES.md
2. Read docs/PROJECT_PLAN.md
3. Follow every architecture rule.
4. Implement ONLY what is requested.
5. Do not modify unrelated files.
6. Explain every generated file.
7. Follow NestJS best practices.
8. Use dependency injection.
9. Keep controllers thin.
10. Put all business logic in services.
11. Use PrismaService for database access.
12. Do not skip validation.
13. Produce production-quality code.

# Prompt - Prisma Module

Read:

docs/PROJECT_RULES.md

docs/PROJECT_PLAN.md

Implement only the Prisma Module.

Requirements:

- Create PrismaModule.
- Create PrismaService.
- Extend PrismaClient.
- Connect and disconnect using NestJS lifecycle hooks.
- Export PrismaService.
- Use dependency injection.
- Do not generate authentication.
- Do not generate DTOs.
- Do not generate controllers.
- Explain every file before applying changes.