<!-- logerror.md -->

<!-- BEGIN:error-monitoring-rules -->

# Error Monitoring & Logging Rules

## Goal

Catch and log bugs/errors happening on the live (Vercel) site — not just

in local dev — so issues can be found and fixed without waiting for a

user to report them.

## Simple rules for agents

1. **Every API route must catch errors, not crash silently.**

   Wrap route logic in try/catch. On error: log details with

   `console.error()` (Vercel captures these in its function logs) and

   return a proper JSON error response with a status code — never let

   an unhandled error return an empty/broken response.

```typescript

   catch (error) {

     console.error("[route-name] failed:", error);

     return NextResponse.json({ error: "Something went wrong" }, { status: 500 });

   }

```

2. **Client-side errors need a boundary.** Any page or component that

   can throw during render (data-dependent UI, third-party embeds) should

   be wrapped in an `error.tsx` file (Next.js App Router convention) so a

   crash shows a fallback UI instead of a blank white page.

3. **Log with context, not just the error.** Include what was being

   attempted — e.g. `console.error("[shatakamu] failed to read poem:", key, error)`

   — not just `console.error(error)`. Bare error logs are hard to trace

   later in Vercel's dashboard.

4. **Don't log sensitive data.** Never log API keys, tokens, full request

   bodies with user data, or env variables — only the error and enough

   context to debug (route name, relevant param, error message).

5. **Check Vercel's dashboard, don't guess.** Errors after deployment

   show up under Project → Deployments → [deployment] → Functions logs

   (or Runtime Logs). Before assuming a fix worked, verify no new errors

   appear there after redeploying.

6. **New routes/components must follow this pattern from day one.**

   Any new API route or data-fetching component created by an agent

   should already include try/catch + console.error, not have it

   added later as a fix.

<!-- END:error-monitoring-rules --> i