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
};

export const setItem = (key: string, value: string) => {
	try {
		return localStorage.setItem(key, value);
	} catch (error) {
		console.error(error);
	}
};

export const removeItem = (key: string) => {
	try {
		return localStorage.removeItem(key);
	} catch (error) {
		console.error(error);
	}
};

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>];
export function useLocalStorage<T>(
	key: string,
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>];
export function useLocalStorage<T>(key: string, defaultValue?: T) {
	const [value, setValue] = React.useState(defaultValue);

	React.useEffect(() => {
		const value = getItem(key);
		if (value == null) return;

		setValue(JSON.parse(value));
	}, []);

	const skip = React.useRef(true);
	React.useEffect(() => {
		// Skip first to not save default value.
		if (skip.current) {
			skip.current = false;
			return;
		}

		if (value == null) return removeItem(key);

		setItem(key, JSON.stringify(value));
	}, [value]);

	return [value, setValue] as const;
}
