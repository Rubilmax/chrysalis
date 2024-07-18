import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React from "react";

export interface ApyProps extends TypographyProps {
	title?: string;
	placement?:
		| "bottom-end"
		| "bottom-start"
		| "bottom"
		| "left-end"
		| "left-start"
		| "left"
		| "right-end"
		| "right-start"
		| "right"
		| "top-end"
		| "top-start"
		| "top";
	apy?: number | null;
	dailyApy?: number | null;
	weeklyApy?: number | null;
	monthlyApy?: number | null;
}

const Apy = ({
	title,
	placement = "top",
	apy,
	dailyApy,
	weeklyApy,
	monthlyApy,
	...props
}: ApyProps) => {
	return (
		<Tooltip
			placement={placement}
			title={
				(title != null ||
					monthlyApy != null ||
					weeklyApy != null ||
					dailyApy != null) && (
					<Stack>
						{title != null && (
							<Typography variant="caption" fontWeight={500}>
								{title}
							</Typography>
						)}
						<Stack direction="row" justifyContent="space-between">
							<Stack alignItems="end">
								{monthlyApy != null && (
									<Typography variant="caption">30d</Typography>
								)}
								{weeklyApy != null && (
									<Typography variant="caption">7d</Typography>
								)}
								{dailyApy != null && (
									<Typography variant="caption">1d</Typography>
								)}
							</Stack>
							<Stack ml={2}>
								{monthlyApy != null && (
									<Typography variant="body2">
										{(monthlyApy * 100).toFixed(2)}%
									</Typography>
								)}
								{weeklyApy != null && (
									<Typography variant="body2">
										{(weeklyApy * 100).toFixed(2)}%
									</Typography>
								)}
								{dailyApy != null && (
									<Typography variant="body2">
										{(dailyApy * 100).toFixed(2)}%
									</Typography>
								)}
							</Stack>
						</Stack>
					</Stack>
				)
			}
		>
			{apy != null ? (
				<Typography {...props}>{(apy * 100).toFixed(2)}%</Typography>
			) : (
				<Skeleton height={25} width={60} />
			)}
		</Tooltip>
	);
};

export default React.memo(Apy);
