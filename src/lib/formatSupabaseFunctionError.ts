export function formatSupabaseFunctionInvokeError(err: unknown): string {
  const e = err as any;

  // supabase-js FunctionsHttpError usually has `context: { status, body }`
  const ctx = e?.context;
  const body = ctx?.body;

  if (body) {
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        if (parsed?.error && typeof parsed.error === "string") return parsed.error;
      } catch {
        // ignore JSON parse failures
      }
      return body;
    }

    if (typeof body === "object") {
      const maybeError = body?.error;
      if (typeof maybeError === "string") return maybeError;
      try {
        return JSON.stringify(body);
      } catch {
        // ignore stringify failures
      }
    }
  }

  if (typeof e?.details === "string" && e.details) return e.details;
  if (typeof e?.message === "string" && e.message) return e.message;

  return "Something went wrong. Please try again.";
}

