// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
export const isDefined = <T>(value: T | null | undefined | void): value is T =>
	value != null;
