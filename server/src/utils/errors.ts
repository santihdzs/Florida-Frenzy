export function notFound(message: string) {
  return { statusCode: 404, error: 'Not Found', message };
}

export function conflict(message: string) {
  return { statusCode: 409, error: 'Conflict', message };
}

export function unauthorized(message: string) {
  return { statusCode: 401, error: 'Unauthorized', message };
}

export function badRequest(message: string) {
  return { statusCode: 400, error: 'Bad Request', message };
}
