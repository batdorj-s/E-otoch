import { secureStorage } from "./storageUtils";

// Get or generate a unique persistent User ID for this device
export const getOrGenerateUserId = (): string => {
  let userId = secureStorage.load("eotoch_user_id");
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    secureStorage.save("eotoch_user_id", userId);
  }
  return userId;
};

// Generic REST caller to our Express Backend
async function callBackend(method: "GET" | "POST", endpoint: string, body?: any) {
  try {
    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, config);

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`Backend API error (${endpoint}):`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`Local Express server not reachable, utilizing offline local secureStorage:`, error);
    return null;
  }
}

// 1. Sync User Health Profile (Answers and Risk results) to cloud via Backend
export const syncUserDataToCloud = async (answers: any, results: any) => {
  const userId = getOrGenerateUserId();
  return await callBackend("POST", "/api/users/sync", { userId, answers, results });
};

// 2. Fetch User Health Profile from Cloud via Backend
export const fetchUserDataFromCloud = async (): Promise<{ answers: any; results: any } | null> => {
  const userId = getOrGenerateUserId();
  const res = await callBackend("GET", `/api/users/${userId}`);
  if (res && res.answers && res.results) {
    return {
      answers: res.answers,
      results: res.results,
    };
  }
  return null;
};

// 3. Sync Voice Chat Messages to cloud via Backend
export const syncVoiceMessagesToCloud = async (messages: any[]) => {
  const userId = getOrGenerateUserId();
  return await callBackend("POST", "/api/conversations/sync", { userId, messages });
};

// 4. Fetch Voice Chat Messages from Cloud via Backend
export const fetchVoiceMessagesFromCloud = async (): Promise<any[] | null> => {
  const userId = getOrGenerateUserId();
  const res = await callBackend("GET", `/api/conversations/${userId}`);
  if (res && res.messages) {
    return res.messages;
  }
  return null;
};

// 5. Sync Lung Analysis scan & results to cloud via Backend
export const syncLungAnalysisToCloud = async (originalImage: string, segmentedImage: string | null, risk: number, status: string, details: string[]) => {
  const userId = getOrGenerateUserId();
  return await callBackend("POST", "/api/lung/sync", { userId, originalImage, segmentedImage, risk, status, details });
};

// 6. Fetch Lung Analysis scan history from cloud
export const fetchLungAnalysisFromCloud = async (): Promise<any[] | null> => {
  const userId = getOrGenerateUserId();
  const res = await callBackend("GET", `/api/lung/${userId}`);
  return res && res.history ? res.history : null;
};
