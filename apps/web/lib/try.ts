export const tryCatch = async <T>(
	promise: Promise<T> | T,
): Promise<[T, null] | [null, Error]> => {
	try {
		const result = await promise;
		return [result, null];
	} catch (error) {
		if (!(error instanceof Error)) {
			console.error(`[try-catch] Unknown error:`, error);
			return [null, new Error("Unknown error")];
		}
		return [null, error];
	}
};
