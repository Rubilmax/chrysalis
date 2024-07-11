import Slider, { type SliderProps } from "@mui/material/Slider";
import React from "react";

export interface LeverageFieldProps extends SliderProps {
	value: number;
	setValue: React.Dispatch<React.SetStateAction<number>>;
	max: number;
}

const LeverageField = ({ value, setValue, ...props }: LeverageFieldProps) => {
	const scaleIn = React.useCallback(
		(x: number) => props.max ** ((x - 1) / (props.max - 1)),
		[props.max],
	);
	const scaleOut = React.useCallback(
		(x: number) => 1 + ((props.max - 1) * Math.log(x)) / Math.log(props.max),
		[props.max],
	);

	const marks = React.useMemo(
		() =>
			[1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50].map((value) => ({
				value: scaleOut(value),
				label: `×${value}`,
			})),
		[scaleOut],
	);

	return (
		<Slider
			value={scaleOut(value)}
			onChange={(_, value) => setValue(scaleIn(value as number))}
			min={1}
			step={0.1}
			scale={scaleIn}
			marks={marks}
			valueLabelDisplay="auto"
			valueLabelFormat={(value) => `×${value.toFixed(2)}`}
			{...props}
		/>
	);
};

export default React.memo(LeverageField);
