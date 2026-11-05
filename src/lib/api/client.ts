export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api(path: string, body?: unknown) {
  let response: Response;
  try {
    response = await fetch(`/api/platform/${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor.");
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const detail = data && typeof data === "object" && "detail" in data ? data.detail : null;
    throw new ApiError(
      response.status,
      typeof detail === "string" ? detail : "Não foi possível concluir a solicitação.",
    );
  }
  return response.status === 204 ? null : response.json();
}
