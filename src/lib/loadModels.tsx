"use client";
import { Model } from "@openrouter/sdk/models";
import { createServerFn } from "@tanstack/react-start";

export const loadModels = createServerFn({ method: "GET" }).handler(async () => {
  "use server";
  const url = "https://openrouter.ai/api/v1/models?max_price=0&order=latency-low-to-high";
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}` },
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!Array.isArray(data?.data)) {
      return [];
    }
    return data.data.filter((model: Model) => {
      const price = new Set(Object.values(model.pricing));
      if (price.size !== 1) {
        return false;
      }
      return +[...price][0] === 0;
    }) as Array<Model>;
  } catch (error) {
    console.error(error);
  }
});
