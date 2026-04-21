/** Unwrap a direct `await myAction(...)` call when not using hooks. */
export function unwrapSafeActionResult<T>(result: {
	data?: T;
	serverError?: string;
	validationErrors?: unknown;
}): T {
	if (result.serverError) {
		throw new Error(result.serverError);
	}
	if (result.validationErrors) {
		throw new Error("Validation failed");
	}
	return result.data as T;
}
