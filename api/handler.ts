import type { Handler } from "aws-lambda";

export const hello: Handler = async (event, context) => {
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: "Go Serverless v4! Your function executed successfully!",
		}),
	};
};
