export function classifyLinkResult({ status, sameOrigin, error }) {
  if (error) return sameOrigin ? "dead" : "unreachable";
  if (status === 404 || status === 410) return "dead";
  if (sameOrigin && status >= 400) return "dead";
  if ([401, 403, 429].includes(status)) return "blocked";
  if (status >= 500) return "unreachable";
  if (status >= 400) return "unreachable";
  return "ok";
}
