import { type OpenAIProvider } from "@ai-sdk/openai";
import { createAiGateway } from "ai-gateway-provider";
import { createUnified } from "ai-gateway-provider/providers/unified";

import { env } from "../env";

const CLOUDFLARE_AI_MODEL_ID = "workers-ai/@cf/openai/gpt-oss-20b" as const;

export type CloudflareAIModel = ReturnType<OpenAIProvider>;

function getProvider(modelId: string) {
	const aigateway = createAiGateway({
		accountId: env.CLOUDFLARE_ACCOUNT_ID,
		gateway: "umo",
		apiKey: env.CLOUDFLARE_AIG_API_KEY,
	});
	const unified = createUnified();
	return aigateway(unified(modelId));
}

export function getCloudflareModel(
	modelId: string = CLOUDFLARE_AI_MODEL_ID,
): CloudflareAIModel {
	return getProvider(modelId);
}
