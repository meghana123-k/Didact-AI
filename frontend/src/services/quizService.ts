import { Quiz, QuizAttempt } from "../types";

const API_BASE_URL = "http://127.0.0.1:5001/api/quiz";

export const quizService = {
  // ===============================
  //  Generate Quiz
  // POST /api/quiz/generate/<topic_id>
  // ===============================
  async generate(topicId: string, token: string): Promise<Quiz> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate/${topicId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Quiz generation failed");
      }

      return response.json();
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        throw new Error(
          "Backend Unreachable. Ensure Flask is running on http://127.0.0.1:5001",
        );
      }
      throw err;
    }
  },

  async submitAttempt(
    quizId: string,
    answers: number[],
    timeTaken: number,
    integrityFlags: string[],
    token: string,
  ): Promise<QuizAttempt> {
    const response = await fetch(`${API_BASE_URL}/attempt`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quiz_id: quizId,
        answers,
        time_taken_seconds: timeTaken,
        integrity_flags: integrityFlags,
      }),
    });

    if (!response.ok) {
      let error: any = {};
      try {
        error = await response.json();
      } catch {
        // network / backend unreachable
        throw new Error(
          "Backend Unreachable. Ensure Flask is running on http://127.0.0.1:5001",
        );
      }

      if (response.status === 429) {
        throw new Error(
          error.error ||
            `Cooldown Active: Wait ${Math.floor(
              (error.retry_after || 0) / 60,
            )} min`,
        );
      }

      throw new Error(error.error || "Attempt submission failed");
    }

    return response.json();
  },

  async getAttemptHistory(
    quizId: string,
    token: string,
  ): Promise<QuizAttempt[]> {
    const response = await fetch(`${API_BASE_URL}/history/${quizId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load attempt history");
    }

    return response.json();
  },
  async getTopicAttemptHistory(
    topicId: string,
    token: string,
  ): Promise<QuizAttempt[]> {
    const response = await fetch(`${API_BASE_URL}/topic-history/${topicId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load topic attempt history");
    }

    return response.json();
  },
};
