export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vedaapex-vedaapex.hf.space";
export const API_BASE_URL = API_URL;

export const ENDPOINTS = {
  // Authentication & API Keys
  register: `${API_URL}/api/v1/auth/register`,
  login: `${API_URL}/api/v1/auth/login`,
  me: `${API_URL}/api/v1/auth/me`,
  logout: `${API_URL}/api/v1/auth/logout`,
  generateApiKey: `${API_URL}/api/v1/auth/api-key/generate`,
  getApiKey: `${API_URL}/api/v1/auth/api-key`,
  revokeApiKey: `${API_URL}/api/v1/auth/api-key/revoke`,
  oauthMe: `${API_URL}/api/v1/auth/oauth_me`,

  // OAuth Logins & Callbacks
  githubLogin: `${API_URL}/auth/github/login`,
  googleLogin: `${API_URL}/auth/google/login`,
  canvaLogin: `${API_URL}/auth/canva/login`,
  canvaCallback: `${API_URL}/auth/canva/callback`,
  canvaRefresh: `${API_URL}/auth/canva/refresh`,
  figmaLogin: `${API_URL}/auth/figma/login`,
  figmaCallback: `${API_URL}/auth/figma/callback`,
  figmaRefresh: `${API_URL}/auth/figma/refresh`,
  oauthCallback: `${API_URL}/auth/callback`,

  // AI Tools (/api/v1/ai/...)
  generateImage: `${API_URL}/api/v1/ai/generate/image`,
  generateVideo: `${API_URL}/api/v1/ai/generate/video`,
  generateText: `${API_URL}/api/v1/ai/generate/text`,
  generateTextToText: `${API_URL}/api/v1/ai/generate/text-to-text`,
  generatePrompt: `${API_URL}/api/v1/ai/generate/prompt`,
  generateCode: `${API_URL}/api/v1/ai/generate/code-generate`,
  generate3D: `${API_URL}/api/v1/ai/generate/3d`,
  generateTTS: `${API_URL}/api/v1/ai/generate/tts`,
  generateWeddingCard: `${API_URL}/api/v1/ai/generate/wedding-card`,
  generateLogo: `${API_URL}/api/v1/ai/generate/logo`,
  enhanceImage: `${API_URL}/api/v1/ai/enhance/image`,
  generatePPT: `${API_URL}/api/v1/ai/generate/ppt`,
  generateWord: `${API_URL}/api/v1/ai/generate/word`,
  generateExcel: `${API_URL}/api/v1/ai/generate/excel`,
  generateMusic: `${API_URL}/api/v1/ai/generate/music`,
  generatePDF: `${API_URL}/api/v1/ai/generate/pdf`,

  // Admin (/api/v1/admin/...)
  getAllUsers: `${API_URL}/api/v1/admin/users`,
  addCredits: `${API_URL}/api/v1/admin/credits/add`,
  removeCredits: `${API_URL}/api/v1/admin/credits/remove`,
  toggleUserStatus: (userId: string) => `${API_URL}/api/v1/admin/users/${userId}/toggle`,
  analytics: `${API_URL}/api/v1/admin/analytics`,
  crashStatus: `${API_URL}/api/v1/admin/crash-status`,
  clearCrash: `${API_URL}/api/v1/admin/clear-crash`,
  keyStatus: `${API_URL}/api/v1/admin/key-status`,

  // AI Generation Credits
  getCosts: `${API_URL}/api/v1/generate/costs`,
  processGenType: (genType: string) => `${API_URL}/api/v1/generate/${genType}`,
  getHistory: `${API_URL}/api/v1/generate/history`,

  // Promo Codes
  redeemPromo: `${API_URL}/api/v1/promo/redeem`,
  createPromo: `${API_URL}/api/v1/promo/create`,
  listPromos: `${API_URL}/api/v1/promo/list`,

  // Subscriptions
  getPlans: `${API_URL}/api/v1/subscriptions/plans`,
  currentPlan: `${API_URL}/api/v1/subscriptions/current`,
  subscribe: `${API_URL}/api/v1/subscriptions/subscribe`,

  // Wallet & Credits
  walletBalance: `${API_URL}/api/v1/wallet/balance`,
  transactions: `${API_URL}/api/v1/wallet/transactions`,
  dailyReward: `${API_URL}/api/v1/wallet/daily-reward`,
  streak: `${API_URL}/api/v1/wallet/streak`,
  referrals: `${API_URL}/api/v1/wallet/referrals`,

  // Developer API Keys
  generateDevKey: `${API_URL}/api/v1/api-keys/generate`,
  listKeys: `${API_URL}/api/v1/api-keys/list`,
  revokeKey: (keyId: string) => `${API_URL}/api/v1/api-keys/revoke/${keyId}`,
  apiUsage: `${API_URL}/api/v1/api-keys/usage`,
  apiLimits: `${API_URL}/api/v1/api-keys/limits`,
  apiAnalytics: `${API_URL}/api/v1/api-keys/analytics`,
  devSubscription: `${API_URL}/api/v1/api-keys/subscription`,

  // Payments
  createOrder: `${API_URL}/api/v1/payments/orders`,
  verifyPayment: `${API_URL}/api/v1/payments/verify`,
  verifyAndUpgrade: `${API_URL}/api/v1/payments/verify-payment`,
  razorpayWebhook: `${API_URL}/api/v1/payments/webhook/razorpay`,

  // Canva & Figma Integrations
  canvaDesign: `${API_URL}/api/v1/canva/design`,
  canvaCommand: `${API_URL}/api/v1/canva/command`,
  canvaStatus: `${API_URL}/api/v1/canva/status`,
  canvaConnect: `${API_URL}/api/v1/canva/connect`,
  canvaDisconnect: `${API_URL}/api/v1/canva/disconnect`,
  figmaDesign: `${API_URL}/api/v1/figma/design`,
  figmaCommand: `${API_URL}/api/v1/figma/command`,
  figmaStatus: `${API_URL}/api/v1/figma/status`,
  figmaConnect: `${API_URL}/api/v1/figma/connect`,
  figmaDisconnect: `${API_URL}/api/v1/figma/disconnect`,

  // Search History
  saveSearchHistory: `${API_URL}/api/v1/search/history`,
  listSearchHistory: `${API_URL}/api/v1/search/history`,
  getSearchHistoryResults: (historyId: string) => `${API_URL}/api/v1/search/history/${historyId}/results`,
  generateSearchTitle: `${API_URL}/api/v1/search/title/generate`,

  // Chat Memory
  askChat: `${API_URL}/api/v1/chat/ask`,
  newChatSession: `${API_URL}/api/v1/chat/session/new`,
  listChatSessions: `${API_URL}/api/v1/chat/sessions`,
  getChatSessionMessages: (sessionId: string) => `${API_URL}/api/v1/chat/sessions/${sessionId}/messages`,

  // Google Workspace
  googleConnect: `${API_URL}/api/v1/google/connect`,
  googleCallback: `${API_URL}/api/v1/google/callback`,
  googleStatus: `${API_URL}/api/v1/google/status`,
  googleDisconnect: `${API_URL}/api/v1/google/disconnect`,

  // Email API
  emailRegister: `${API_URL}/api/v1/email/register`,
  emailLogin: `${API_URL}/api/v1/email/login`,
  verifyEmail: `${API_URL}/api/v1/email/verify`,
  resendVerification: `${API_URL}/api/v1/email/resend-verification`,
  emailHealth: `${API_URL}/api/v1/email/health`,

  // SaaS Media Processing
  uploadImage: `${API_URL}/api/v1/media/upload/image`,
  uploadVideo: `${API_URL}/api/v1/media/upload/video`,
  mediaEnhanceImage: `${API_URL}/api/v1/media/enhance/image`,
  mediaEnhanceVideo: `${API_URL}/api/v1/media/enhance/video`,
  removeWatermarkImage: `${API_URL}/api/v1/media/remove-watermark/image`,
  removeWatermarkVideo: `${API_URL}/api/v1/media/remove-watermark/video`,
  taskStatus: (id: string) => `${API_URL}/api/v1/media/task/status/${id}`,
  mediaTasks: `${API_URL}/api/v1/media/tasks`,
  retryTask: (id: string) => `${API_URL}/api/v1/media/task/${id}/retry`,
  fileDownload: (filename: string) => `${API_URL}/api/v1/media/download/${filename}`,
  cleanupTask: (id: string) => `${API_URL}/api/v1/media/cleanup/${id}`,

  // Admin Media Dashboard
  queueStatus: `${API_URL}/api/v1/admin/dashboard/queue/status`,
  tasksList: `${API_URL}/api/v1/admin/dashboard/tasks/list`,
  usageMetrics: `${API_URL}/api/v1/admin/dashboard/usage/metrics`,

  // Media Processor
  processorHealth: `${API_URL}/api/v1/media-processor/health`,
  processMedia: `${API_URL}/api/v1/media-processor/process`,
  bgRemovalImage: `${API_URL}/api/v1/media-processor/upload/image/background-removal`,
  bgRemovalVideo: `${API_URL}/api/v1/media-processor/upload/video/background-removal`,
  enhanceImageProcessor: `${API_URL}/api/v1/media-processor/upload/image/enhance`,
  enhanceVideoProcessor: `${API_URL}/api/v1/media-processor/upload/video/enhance`,

  // Assets
  serveAsset: (assetId: string) => `${API_URL}/api/v1/assets/${assetId}`,
  deleteAsset: (assetId: string) => `${API_URL}/api/v1/assets/${assetId}`,
  downloadAsset: (assetId: string) => `${API_URL}/api/v1/assets/${assetId}/download`,
  listUserAssets: (userId: string) => `${API_URL}/api/v1/assets/user/${userId}`,

  // Admin Dashboard
  adminDashboardOverview: `${API_URL}/api/v1/admin/dashboard`,
  adminDashboardRequests: `${API_URL}/api/v1/admin/dashboard/requests`,
  adminDashboardGenerations: `${API_URL}/api/v1/admin/dashboard/generations`,
  adminDashboardProviders: `${API_URL}/api/v1/admin/dashboard/providers`,
  adminDashboardModels: `${API_URL}/api/v1/admin/dashboard/models`,
  adminDashboardErrors: `${API_URL}/api/v1/admin/dashboard/errors`,
  adminDashboardUsageLogs: `${API_URL}/api/v1/admin/dashboard/usage-logs`,
  adminDashboardStorage: `${API_URL}/api/v1/admin/dashboard/storage`,
  adminDashboardHealth: `${API_URL}/api/v1/admin/dashboard/health`,

  // System
  health: `${API_URL}/health`,
  ready: `${API_URL}/ready`,
  home: `${API_URL}/`,
};

export function getStoredAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
}

export function setStoredAccessToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", token);
  }
}

export function clearStoredAuthTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
}

export async function apiWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API call failed. Retrying... (${retries} attempts left)`);
      return apiWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    LOGOUT: "/api/v1/auth/logout",
  },
  USER: {
    SYNC: "/api/v1/auth/me",
    PROFILE: "/api/v1/auth/me",
  },
  WALLET: "/api/v1/wallet/balance",
};
