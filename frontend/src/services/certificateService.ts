import { Certificate } from "../types";

const API_BASE_URL = "http://127.0.0.1:5001/api/certificate";

export const certificateService = {
  async generate(quizId: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/generate/${quizId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || error.error || "Certificate generation failed",
      );
    }
    return response.json();
  },

  getDownloadUrl(certUid: string): string {
    return `${API_BASE_URL}/download/${certUid}`;
  },
};
