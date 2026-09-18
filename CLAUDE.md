# Working rules for Claude Code

This repo is being upgraded from a single-tenant service booking API into a
multi-tenant appointment booking platform. The full plan lives in
`PROJECT_PLAN.md` — read it before starting any work here.

1. **Explore first.** Read the existing repo and summarise what exists vs. the plan before writing code.
2. **Plan before coding.** For each week, propose a short task list and wait for approval. Work in small steps.
3. **One feature at a time,** on its own branch, with tests in the same change. Use conventional commit messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
4. **Teach as you go.** The developer must understand every line. Explain design choices and trade-offs in plain language, and prefer simple, conventional NestJS patterns.
5. **Do not expand scope.** Do not add libraries, services, or features that are not in the plan without asking.
6. **Never invent numbers** (coverage, latency, throughput). Only report what was measured by running the tools.
7. **Security basics always:** no secrets in code, validate all input, never trust a tenant ID from the request, never log sensitive data.
8. **Keep the repo runnable at all times:** the main branch must always build and pass tests.
9. **Flag risks and unknowns** (for example timezone edge cases or Prisma limitations) instead of guessing.
10. **Update docs** (README, `.env.example`, Swagger, ADRs) in the same change as the code they describe.
