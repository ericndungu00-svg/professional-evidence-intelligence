export async function requireJsonTrpcResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) return response;
  const preview = (await response.clone().text()).replace(/\s+/g, " ").slice(0, 100);
  const gatewayMessage = response.status >= 500
    ? "The analysis service returned an upstream error page. The request may have exceeded a service limit; please retry once."
    : "The analysis service returned an unexpected page instead of a data response. Please refresh and sign in again before retrying.";
  throw new Error(`Analysis request could not be completed (${response.status || "network error"}). ${gatewayMessage}${preview ? ` Response preview: ${preview}` : ""}`);
}
