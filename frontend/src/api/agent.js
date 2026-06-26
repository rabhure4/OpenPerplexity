import axios from "axios";
import { config } from "../config";

const RUN_ENDPOINT = `${config.apiBaseUrl}/run`;
const STREAM_ENDPOINT = `${config.apiBaseUrl}/run/stream`;
const MODELS_ENDPOINT = `${config.apiBaseUrl}/models`;

export async function runAgent(query, options = {}) {
  try {
    const { data } = await axios.post(RUN_ENDPOINT, {
      query,
      llm_provider: options.llmProvider,
      llm_model: options.llmModel,
      llm_api_key: options.llmApiKey,
      search_provider: options.searchProvider,
      search_api_key: options.searchApiKey,
    });
    return data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
}

export async function listModels(provider, apiKey) {
  try {
    const { data } = await axios.post(MODELS_ENDPOINT, {
      provider,
      api_key: apiKey,
    });
    return data.models ?? [];
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Could not load models.";
    throw new Error(message);
  }
}

function parseSseBlock(block) {
  const lines = block.split("\n");
  let event = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return {
    event,
    data: JSON.parse(dataLines.join("\n")),
  };
}

export async function runAgentStream(query, options = {}, handlers = {}) {
  const response = await fetch(STREAM_ENDPOINT, {
    method: "POST",
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      query,
      llm_provider: options.llmProvider,
      llm_model: options.llmModel,
      llm_api_key: options.llmApiKey,
      search_provider: options.searchProvider,
      search_api_key: options.searchApiKey,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Streaming request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block.trim());
      if (!parsed) continue;

      if (parsed.event === "trace") handlers.onTrace?.(parsed.data);
      if (parsed.event === "sources") handlers.onSources?.(parsed.data.sources ?? []);
      if (parsed.event === "answer_delta") handlers.onAnswerDelta?.(parsed.data.text ?? "");
      if (parsed.event === "final") handlers.onFinal?.(parsed.data);
      if (parsed.event === "error") throw new Error(parsed.data.message ?? "Streaming failed.");
    }
  }
}
