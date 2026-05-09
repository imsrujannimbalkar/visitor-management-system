import { GoogleGenAI, Type } from "@google/genai";
import { Visitor, Donation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async getVisitorInsights(visitors: Visitor[], donations: Donation[]) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing Gemini API Key. Please ensure it is set in your environment.");
    }

    const visitorData = visitors.slice(0, 100).map(v => ({
      name: v.name,
      category: v.category,
      purpose: v.purpose,
      checkIn: v.checkInTime,
      count: v.visitCount
    }));

    const donationData = donations.slice(0, 100).map(d => ({
      amount: d.amount,
      type: d.type,
      date: d.date,
      donor: d.visitorName
    }));

    const prompt = `
      As an expert AI Analyst for an Organization Management System, analyze the following visitor and donation data:
      
      Visitors (Sample): ${JSON.stringify(visitorData)}
      Donations (Sample): ${JSON.stringify(donationData)}
      
      Provide insights in three specific categories:
      1. Frequent Visitor Detection: Who are the most regular visitors and what defines their behavior? Give a short concise summary.
      2. Donation Patterns: What are the trends in giving (frequency, amounts, popular types)? Give a short concise summary.
      3. Visit Purpose Analysis: Why do people mostly visit and are there any emerging needs? Give a short concise summary.
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              frequentVisitors: { type: Type.STRING },
              donationPatterns: { type: Type.STRING },
              visitPurpose: { type: Type.STRING }
            },
            required: ["frequentVisitors", "donationPatterns", "visitPurpose"]
          }
        }
      });
      
      const text = result.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Analysis error:", error);
      throw error;
    }
  }
};
