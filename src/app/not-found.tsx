import FindInPageIcon from "@mui/icons-material/FindInPage";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function NotFound() {
	return (
		<Stack alignItems="center">
			<Stack direction="row" alignItems="center" spacing={2}>
				<FindInPageIcon fontSize="large" />
				<Typography variant="h1">Not Found</Typography>
			</Stack>
			<Typography variant="subtitle1">
				We could not find the page you were looking for.
			</Typography>
		</Stack>
	);
}
