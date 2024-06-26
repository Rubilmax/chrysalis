import React from "react";

// @ts-ignore
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export const getItem = (key: string) => {
	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.error(error);
	}

	return null;
};

export const setItem = <T>(key: string, value: T) => {
	if (value == null) return removeItem(key);

	const newValue = JSON.stringify(value);

	try {
		localStorage.setItem(key, newValue);
		dispatchStorageEvent(key, newValue); // Natively dispatched only to other browsing contexts.
	} catch (error) {
		console.error(error);
	}
};

export const removeItem = (key: string) => {
	try {
		localStorage.removeItem(key);
		dispatchStorageEvent(key, null); // Natively dispatched only to other browsing contexts.
	} catch (error) {
		console.error(error);
	}
};

const dispatchStorageEvent = (key: string, newValue: string | null) => {
	window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
};

const subscribeLocalStorage = (callback: (event: StorageEvent) => void) => {
	window.addEventListener("storage", callback);

	return () => window.removeEventListener("storage", callback);
};

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>];
export function useLocalStorage<T>(
	key: string,
	initialValue?: T,
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];
export function useLocalStorage<T>(key: string, initialValue?: T) {
	const store = React.useSyncExternalStore(
		subscribeLocalStorage,
		() => getItem(key),
		() => JSON.stringify(initialValue) as string | undefined,
	);

	const setState = React.useCallback(
		(v: React.SetStateAction<T | undefined>) =>
			setItem(
				key,
				typeof v === "function"
					? // @ts-ignore
						v(store ? JSON.parse(store) : undefined)
					: v,
			),
		[key, store],
	);

	React.useEffect(() => {
		if (getItem(key) === null && initialValue != null)
			setItem(key, initialValue);
	}, [key, initialValue]);

	return [store ? JSON.parse(store) : undefined, setState];
}
