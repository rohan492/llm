import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "langchain/prompts";
import { ConversationalChain } from "langchain/chains";
import populateVectorStore from "../utils/lycaMobileScraper";

let vectorStore;

export async function POST(request) {
  const { query, agentType } = await request.json();

  // Initialize the LLM
  const model = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0.7,
  });

  let template, prompt, chain, result;

  switch (agentType) {
    case "llm":
      template =
        "You are a helpful AI assistant. Answer the following query: {query}";
      prompt = new PromptTemplate({ template, inputVariables: ["query"] });
      chain = new ConversationalChain({ llm: model, prompt });
      result = await chain.call({ query });
      break;

    case "vectorDb":
      if (!vectorStore) {
        vectorStore = await populateVectorStore();
        if (!vectorStore) {
          return NextResponse.json(
            { error: "Failed to initialize vector store" },
            { status: 500 },
          );
        }
      }
      const vectorResults = await vectorStore.similaritySearch(query, 3);
      template =
        "You are an AI assistant for Lyca Mobile. Use the following information to answer the query. If the information is not directly relevant, use it as context to infer an appropriate response about Lyca Mobile services.\n\nInformation:\n{info}\n\nQuery: {query}";
      prompt = new PromptTemplate({
        template,
        inputVariables: ["info", "query"],
      });
      chain = new ConversationalChain({ llm: model, prompt });
      result = await chain.call({
        info: vectorResults.map((r) => r.pageContent).join("\n"),
        query,
      });
      break;

    case "fallback":
      template =
        "You are an AI assistant for Lyca Mobile. The user's query was not understood. Politely ask for clarification and provide some general information about Lyca Mobile services: {query}";
      prompt = new PromptTemplate({ template, inputVariables: ["query"] });
      chain = new ConversationalChain({ llm: model, prompt });
      result = await chain.call({ query });
      break;

    case "workflow":
      template =
        "You are an AI assistant helping with a SIM swap process for Lyca Mobile. Guide the user through the initial steps and ask for necessary information: {query}";
      prompt = new PromptTemplate({ template, inputVariables: ["query"] });
      chain = new ConversationalChain({ llm: model, prompt });
      result = await chain.call({ query });
      break;

    default:
      return NextResponse.json({ error: "Invalid agent type" });
  }

  return NextResponse.json({ response: result.text });
}
