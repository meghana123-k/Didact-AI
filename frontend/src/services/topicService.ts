import { Topic } from "../types";

const API_BASE_URL = "http://127.0.0.1:5001/api/topic";

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
          "Backend Unreachable. Ensure Flask is running on http://127.0.0.1:5001",
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
