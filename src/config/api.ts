export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vedaapex-saas-ai.onrender.com";
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

  // Commands (/api/v1/commands/...)
  listCommands: `${API_URL}/api/v1/commands`,
  validateCommand: `${API_URL}/api/v1/commands/validate`,
  executeCommand: `${API_URL}/api/v1/commands/execute`,

  // Presentations (/api/v1/presentations/...)
  generatePresentation: `${API_URL}/api/v1/presentations/generate`,
  getPresentationDetails: (presentationId: string) => `${API_URL}/api/v1/presentations/${presentationId}`,

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
  paymentsConfig: `${API_URL}/api/v1/payments/config`,
  createOrder: `${API_URL}/api/v1/payments/orders`,
  verifyPayment: `${API_URL}/api/v1/payments/verify`,
  verifyAndUpgrade: `${API_URL}/api/v1/payments/verify-payment`,
  razorpayWebhook: `${API_URL}/api/v1/payments/webhook/razorpay`,

  // Canva & Figma Integrations
  canvaDesign: `${API_URL}/api/v1/canva/design`,
  canvaCommand: `${API_URL}/api/v1/canva/command`,
  canvaStatus: `${API_URL}/api/v1/canva/status`,
  canvaConnect: `${API_URL}/api/v1/canva/connect`,
  canvaApiCallback: `${API_URL}/api/v1/canva/callback`,
  canvaDisconnect: `${API_URL}/api/v1/canva/disconnect`,
  figmaDesign: `${API_URL}/api/v1/figma/design`,
  figmaCommand: `${API_URL}/api/v1/figma/command`,
  figmaStatus: `${API_URL}/api/v1/figma/status`,
  figmaConnect: `${API_URL}/api/v1/figma/connect`,
  figmaApiCallback: `${API_URL}/api/v1/figma/callback`,
  figmaDisconnect: `${API_URL}/api/v1/figma/disconnect`,

  // Google MCP Tools
  mcpGmailSearch: `${API_URL}/api/v1/mcp/google/gmail/search`,
  mcpGmailRead: `${API_URL}/api/v1/mcp/google/gmail/read`,
  mcpGmailSend: `${API_URL}/api/v1/mcp/google/gmail/send`,
  mcpGmailLabels: `${API_URL}/api/v1/mcp/google/gmail/labels`,
  mcpDriveSearch: `${API_URL}/api/v1/mcp/google/drive/search`,
  mcpDriveShare: `${API_URL}/api/v1/mcp/google/drive/share`,
  mcpDriveCreateFolder: `${API_URL}/api/v1/mcp/google/drive/create-folder`,
  mcpDriveDelete: `${API_URL}/api/v1/mcp/google/drive/delete`,
  mcpDocsCreate: `${API_URL}/api/v1/mcp/google/docs/create`,
  mcpDocsRead: `${API_URL}/api/v1/mcp/google/docs/read`,
  mcpDocsAppend: `${API_URL}/api/v1/mcp/google/docs/append`,
  mcpDocsReplace: `${API_URL}/api/v1/mcp/google/docs/replace`,
  mcpSheetsCreate: `${API_URL}/api/v1/mcp/google/sheets/create`,
  mcpSheetsRead: `${API_URL}/api/v1/mcp/google/sheets/read`,
  mcpSheetsAppend: `${API_URL}/api/v1/mcp/google/sheets/append`,
  mcpSheetsUpdate: `${API_URL}/api/v1/mcp/google/sheets/update`,
  mcpSheetsClear: `${API_URL}/api/v1/mcp/google/sheets/clear`,
  mcpSlidesCreate: `${API_URL}/api/v1/mcp/google/slides/create`,
  mcpSlidesInsertText: `${API_URL}/api/v1/mcp/google/slides/insert-text`,
  mcpSlidesAddSlide: `${API_URL}/api/v1/mcp/google/slides/add-slide`,
  mcpSlidesExportPdf: `${API_URL}/api/v1/mcp/google/slides/export-pdf`,
  mcpCalendarList: `${API_URL}/api/v1/mcp/google/calendar/list`,
  mcpCalendarCreate: `${API_URL}/api/v1/mcp/google/calendar/create`,
  mcpCalendarUpdate: `${API_URL}/api/v1/mcp/google/calendar/update`,
  mcpCalendarDelete: `${API_URL}/api/v1/mcp/google/calendar/delete`,
  mcpPeopleList: `${API_URL}/api/v1/mcp/google/people/list`,
  mcpPeopleSearch: `${API_URL}/api/v1/mcp/google/people/search`,
  mcpPeopleGet: `${API_URL}/api/v1/mcp/google/people/get`,

  // Design MCP
  mcpFigmaListFiles: `${API_URL}/api/v1/mcp/designs/figma/list-files`,
  mcpFigmaGetDesign: `${API_URL}/api/v1/mcp/designs/figma/get-design`,
  mcpFigmaCreateFile: `${API_URL}/api/v1/mcp/designs/figma/create-file`,
  mcpFigmaExport: `${API_URL}/api/v1/mcp/designs/figma/export`,
  mcpCanvaListDesigns: `${API_URL}/api/v1/mcp/designs/canva/list-designs`,
  mcpCanvaCreateDesign: `${API_URL}/api/v1/mcp/designs/canva/create-design`,
  mcpCanvaExport: `${API_URL}/api/v1/mcp/designs/canva/export`,
  mcpCanvaDuplicate: `${API_URL}/api/v1/mcp/designs/canva/duplicate`,

  // Connectors
  connectorProviders: `${API_URL}/connectors/providers`,
  connectorLogin: (provider: string) => `${API_URL}/connectors/${provider}/login`,
  connectorCallback: (provider: string) => `${API_URL}/connectors/${provider}/callback`,
  connectorStatus: (provider: string) => `${API_URL}/connectors/${provider}/status`,
  connectorDisconnect: (provider: string) => `${API_URL}/connectors/${provider}/disconnect`,

  // Managed Connectors
  managedConnectorsList: `${API_URL}/connectors/registry`,
  managedConnectorsCreate: `${API_URL}/connectors/registry`,
  managedConnectorGet: (connectorId: string) => `${API_URL}/connectors/registry/${connectorId}`,
  managedConnectorUpdate: (connectorId: string) => `${API_URL}/connectors/registry/${connectorId}`,
  managedConnectorDelete: (connectorId: string) => `${API_URL}/connectors/registry/${connectorId}`,
  managedConnectorValidate: (connectorId: string) => `${API_URL}/connectors/registry/${connectorId}/validate`,
  managedConnectorCallTool: (connectorId: string, toolName: string) =>
    `${API_URL}/connectors/registry/${connectorId}/tools/${toolName}/call`,
  managedConnectorAuthScaffold: (authType: string) =>
    `${API_URL}/connectors/registry/auth/scaffold/${authType}`,

  // Custom MCP Connectors
  mcpConnect: `${API_URL}/api/v1/mcp/connect`,
  mcpDiscover: `${API_URL}/api/v1/mcp/discover`,
  mcpOauthCallback: `${API_URL}/api/v1/mcp/oauth/callback`,
  mcpConnectors: `${API_URL}/api/v1/mcp/connectors`,
  mcpConnectorGet: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}`,
  mcpConnectorUpdate: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}`,
  mcpConnectorDelete: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}`,
  mcpConnectorTest: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}/test`,
  mcpConnectorRefreshTools: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}/refresh-tools`,
  mcpConnectorTools: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}/tools`,
  mcpConnectorCallTool: (id: string, toolName: string) =>
    `${API_URL}/api/v1/mcp/connectors/${id}/tools/${toolName}/call`,
  mcpConnectorReconnect: (id: string) => `${API_URL}/api/v1/mcp/connectors/${id}/reconnect`,

  // Connector MCP Tools
  mcpConnGmailSearch: `${API_URL}/api/v1/mcp/connectors/google/gmail/search`,
  mcpConnGmailRead: `${API_URL}/api/v1/mcp/connectors/google/gmail/read`,
  mcpConnGmailSend: `${API_URL}/api/v1/mcp/connectors/google/gmail/send`,
  mcpConnGmailLabels: `${API_URL}/api/v1/mcp/connectors/google/gmail/labels`,
  mcpConnDriveSearch: `${API_URL}/api/v1/mcp/connectors/google/drive/search`,
  mcpConnDocsRead: `${API_URL}/api/v1/mcp/connectors/google/docs/read`,
  mcpConnDocsAppend: `${API_URL}/api/v1/mcp/connectors/google/docs/append`,
  mcpConnSheetsRead: `${API_URL}/api/v1/mcp/connectors/google/sheets/read`,
  mcpConnSheetsAppend: `${API_URL}/api/v1/mcp/connectors/google/sheets/append`,
  mcpConnCalendarList: `${API_URL}/api/v1/mcp/connectors/google/calendar/list`,
  mcpConnCalendarCreate: `${API_URL}/api/v1/mcp/connectors/google/calendar/create`,
  mcpConnGitHubRepos: `${API_URL}/api/v1/mcp/connectors/github/repos`,
  mcpConnGitHubRepo: `${API_URL}/api/v1/mcp/connectors/github/repo`,
  mcpConnGitHubCommits: `${API_URL}/api/v1/mcp/connectors/github/commits`,
  mcpConnGitHubBranches: `${API_URL}/api/v1/mcp/connectors/github/branches`,
  mcpConnGitHubIssues: `${API_URL}/api/v1/mcp/connectors/github/issues`,
  mcpConnGitHubPrs: `${API_URL}/api/v1/mcp/connectors/github/pull-requests`,
  mcpConnGitHubReleases: `${API_URL}/api/v1/mcp/connectors/github/releases`,
  mcpConnNotionSearch: `${API_URL}/api/v1/mcp/connectors/notion/search`,
  mcpConnNotionRead: `${API_URL}/api/v1/mcp/connectors/notion/read`,
  mcpConnNotionBlocks: `${API_URL}/api/v1/mcp/connectors/notion/blocks`,
  mcpConnNotionDatabases: `${API_URL}/api/v1/mcp/connectors/notion/databases`,
  mcpConnFigmaFiles: `${API_URL}/api/v1/mcp/connectors/figma/files`,
  mcpConnFigmaFile: `${API_URL}/api/v1/mcp/connectors/figma/file`,
  mcpConnFigmaComments: `${API_URL}/api/v1/mcp/connectors/figma/comments`,
  mcpConnFigmaComponents: `${API_URL}/api/v1/mcp/connectors/figma/components`,
  mcpConnFigmaStyles: `${API_URL}/api/v1/mcp/connectors/figma/styles`,
  mcpConnCanvaDesigns: `${API_URL}/api/v1/mcp/connectors/canva/designs`,
  mcpConnCanvaFolders: `${API_URL}/api/v1/mcp/connectors/canva/folders`,

  // Search History
  saveSearchHistory: `${API_URL}/api/v1/search/history`,
  listSearchHistory: `${API_URL}/api/v1/search/history`,
  getSearchHistoryResults: (historyId: string) => `${API_URL}/api/v1/search/history/${historyId}/results`,
  generateSearchTitle: `${API_URL}/api/v1/search/title/generate`,
  deepSearch: `${API_URL}/api/v1/search/deep`,

  // Chat Memory
  chatAsk: `${API_URL}/api/v1/chat/ask`,
  chatNewSession: `${API_URL}/api/v1/chat/session/new`,
  chatSessions: `${API_URL}/api/v1/chat/sessions`,
  chatSessionMessages: (sessionId: string) => `${API_URL}/api/v1/chat/sessions/${sessionId}/messages`,

  // Skills (Persistent + Custom)
  listSkills: `${API_URL}/api/v1/skills`,
  addSkill: `${API_URL}/api/v1/skills`,
  deleteAllSkills: `${API_URL}/api/v1/skills`,
  getSkill: (skillId: string) => `${API_URL}/api/v1/skills/${skillId}`,
  updateSkill: (skillId: string) => `${API_URL}/api/v1/skills/${skillId}`,
  deleteSkill: (skillId: string) => `${API_URL}/api/v1/skills/${skillId}`,
  matchSkills: `${API_URL}/api/v1/skills/match`,
  executeSkills: `${API_URL}/api/v1/skills/execute`,

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

  // Website
  websiteRequirements: `${API_URL}/api/website/requirements`,

  // Legacy AI Tools (non-versioned /ai/...)
  aiGenerateImage: `${API_URL}/ai/generate/image`,
  aiGenerateVideo: `${API_URL}/ai/generate/video`,
  aiGenerateText: `${API_URL}/ai/generate/text`,
  aiGenerateTextToText: `${API_URL}/ai/generate/text-to-text`,
  aiGeneratePrompt: `${API_URL}/ai/generate/prompt`,
  aiGenerateCode: `${API_URL}/ai/generate/code-generate`,
  aiGenerate3D: `${API_URL}/ai/generate/3d`,
  aiGenerateTTS: `${API_URL}/ai/generate/tts`,
  aiGenerateWeddingCard: `${API_URL}/ai/generate/wedding-card`,
  aiGenerateLogo: `${API_URL}/ai/generate/logo`,
  aiEnhanceImage: `${API_URL}/ai/enhance/image`,
  aiGeneratePPT: `${API_URL}/ai/generate/ppt`,
  aiGenerateWord: `${API_URL}/ai/generate/word`,
  aiGenerateExcel: `${API_URL}/ai/generate/excel`,
  aiGenerateMusic: `${API_URL}/ai/generate/music`,
  aiGeneratePDF: `${API_URL}/ai/generate/pdf`,
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
