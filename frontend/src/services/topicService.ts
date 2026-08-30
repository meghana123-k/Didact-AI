import { Topic } from "../types";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/topic`;

export const topicService = {
  //  Summarize + Save Topic (PDF/DOCX/Text)
  async summarize(formData: FormData, token: string): Promise<Topic> {
    const response = await fetch(`${API_BASE_URL}/summarize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let error: any = {};
      try {
        error = await response.json();
      } catch {
        throw new Error(
          "Backend Unreachable. Please check your network connection or try again later.",
        );
      }
      throw new Error(error.error || "Summarization failed");
    }

    return response.json();
  },

  //  Fetch Topic History for Dropdown
  async getHistory(userId: string, token: string): Promise<Topic[]> {
    const response = await fetch(`${API_BASE_URL}/history/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch topic history");
    }

    return response.json();
  },
};
