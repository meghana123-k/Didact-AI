import { Certificate } from "../types";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/certificate`;

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
  async getMyCertificates(token: string) {
    const response = await fetch(`${API_BASE_URL}/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load certificates");
    }

    return response.json();
  },
};
