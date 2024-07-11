import React from "react";

// @ts-ignore
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export const getItem = (key: string) => {
	if (typeof window !== "undefined") {
		try {
			return localStorage.getItem(key);
		} catch (error) {
			console.error(error);
		}
	}

	return null;
};

export const setItem = <T>(key: string, value: T) => {
	if (typeof window === "undefined") return;

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
	if (typeof window === "undefined") return;

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
		(action: React.SetStateAction<T | undefined>) => {
			setItem(
				key,
				typeof action === "function"
					? // @ts-ignore
						action(store ? JSON.parse(store) : undefined)
					: action,
			);
		},
		[key, store],
	);

	React.useEffect(() => {
		if (getItem(key) === null && initialValue != null)
			setItem(key, initialValue);
	}, [key, initialValue]);

	return [store ? JSON.parse(store) : initialValue, setState];
}
