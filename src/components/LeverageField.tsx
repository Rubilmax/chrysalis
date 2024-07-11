import Slider, { type SliderProps } from "@mui/material/Slider";
import React from "react";

export interface LeverageFieldProps extends SliderProps {
	value: number;
	setValue: React.Dispatch<React.SetStateAction<number>>;
	max: number;
}

const LeverageField = ({ value, setValue, ...props }: LeverageFieldProps) => {
	const scale = React.useCallback(
		(x: number) => props.max ** ((x - 1) / (props.max - 1)),
		[props.max],
	);

	const marks = React.useMemo(
		() =>
			[1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50].map((value) => ({
				value: 1 + ((props.max - 1) * Math.log(value)) / Math.log(props.max),
				label: `×${value}`,
			})),
		[props.max],
	);

	return (
		<Slider
			value={value}
			onChange={(_, value) => setValue(value as number)}
			min={1}
			step={0.1}
			scale={scale}
			marks={marks}
			valueLabelDisplay="auto"
			valueLabelFormat={(value) => `×${value.toFixed(2)}`}
			{...props}
		/>
	);
};

export default React.memo(LeverageField);
