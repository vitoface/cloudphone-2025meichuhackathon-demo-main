import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { lat, lng, nearby } = body;

    const response = await openai.responses.create({
      model: "gpt-5.5",

      instructions: `
You are a pedestrian safety assistant.

Analyze the supplied location information.
Do not claim that an area is absolutely safe.
Only make conclusions based on the supplied data.
`,

      input: `
Current location:
latitude: ${lat}
longitude: ${lng}

Nearby map information:
${JSON.stringify(nearby, null, 2)}

Analyze possible safety concerns and give a short recommendation.
`,
    });

    return NextResponse.json({
      analysis: response.output_text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "AI analysis failed",
      },
      {
        status: 500,
      }
    );
  }
}