export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public requestId?: string,
  ) {
    super(message);
  }
}
export async function api(path: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch('/api' + path, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'X-Forge-Request': '1', ...options.headers },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const details = body && typeof body === 'object' && 'error' in body ? body.error : undefined;
    const message =
      details &&
      typeof details === 'object' &&
      'message' in details &&
      typeof details.message === 'string'
        ? details.message
        : 'Request failed.';
    const id =
      details &&
      typeof details === 'object' &&
      'requestId' in details &&
      typeof details.requestId === 'string'
        ? details.requestId
        : undefined;
    throw new ApiError(message, response.status, id);
  }
  return body;
}
