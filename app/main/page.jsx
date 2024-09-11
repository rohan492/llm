"use client";

import { useState } from "react";
import Head from "next/head";

const classifyQuery = (query) => {
  if (
    query.toLowerCase().includes("lyca") ||
    query.toLowerCase().includes("mobile")
  ) {
    return "vectorDb";
  } else if (
    query.toLowerCase().includes("swap") ||
    query.toLowerCase().includes("sim")
  ) {
    return "workflow";
  } else if (query.length < 5 || Math.random() < 0.2) {
    return "fallback";
  } else {
    return "llm";
  }
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const agentType = classifyQuery(query);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, agentType }),
      });
      const data = await res.json();
      setResponse(`${agentType.toUpperCase()} Agent: ${data.response}`);
    } catch (error) {
      setResponse("Error: Unable to process the query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>AI Agent System Demo</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">AI Agent System Demo</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
          className="w-full p-2 border rounded text-black"
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          {loading ? "Processing..." : "Submit"}
        </button>
      </form>

      {response && (
        <div className="mb-4 p-4 bg-gray-100 rounded">{response}</div>
      )}
    </div>
  );
}
