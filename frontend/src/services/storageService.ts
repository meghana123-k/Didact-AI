import { User, Course, ProgressData, Certificate } from "../types";

const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "didact_user",
  COURSES: "didact_courses",
  PROGRESS: "didact_progress",
  CERTIFICATES: "didact_certificates",
};

/* =======================
   AUTH STORAGE
======================= */

export const saveAuth = (user: User, token: string) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

/* =======================
   COURSE STORAGE
======================= */

export const getCourses = (): Course[] => {
  const data = localStorage.getItem(STORAGE_KEYS.COURSES);
  if (data) return JSON.parse(data);

  const initialCourses: Course[] = [
    {
      id: "c1",
      title: "Introduction to Artificial Intelligence",
      description:
        "Master the fundamentals of AI, Machine Learning, and Neural Networks.",
      image: "https://picsum.photos/seed/ai/600/400",
      lessons: [
        {
          id: "l1",
          title: "History of AI",
          content: "Artificial intelligence started in the mid-20th century...",
          completed: false,
        },
      ],
    },
  ];

  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(initialCourses));
  return initialCourses;
};

export const updateCourse = (courses: Course[]) => {
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
};

/* =======================
   ANALYTICS STORAGE
======================= */

export const getProgress = (): ProgressData[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  return data ? JSON.parse(data) : [];
};

export const saveProgress = (newData: ProgressData) => {
  const history = getProgress();
  localStorage.setItem(
    STORAGE_KEYS.PROGRESS,
    JSON.stringify([...history, newData]),
  );
};

/* =======================
   CERTIFICATE STORAGE
======================= */

export const getCertificates = (): Certificate[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
  return data ? JSON.parse(data) : [];
};

export const saveCertificate = (cert: Certificate) => {
  const certs = getCertificates();
  localStorage.setItem(
    STORAGE_KEYS.CERTIFICATES,
    JSON.stringify([...certs, cert]),
  );
};
