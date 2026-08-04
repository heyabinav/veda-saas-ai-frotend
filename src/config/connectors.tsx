import {
  CanvaIcon,
  FigmaIcon,
  GoogleDriveIcon,
  GooglePhotosIcon,
  GitHubIcon,
  SlackIcon,
  NotionIcon,
  DropboxIcon,
} from "@/components/brand-icons";

export type Connector = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  url: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  logoClassName?: string;
    gradient: string;
    softGradient: string;
};

export const CONNECTORS: Connector[] = [
  {
    id: "canva",
    name: "Canva",
    tagline: "Design graphics, presentations & templates",
    description:
      "Unlock the power of Canva inside VedaApex. Access millions of templates, graphics, photos and fonts. Design and export assets directly to your VedaApex workspace in one click.",
    features: [
      "Access millions of templates and design elements",
      "Export designs directly to your VedaApex workspace",
      "Photos, fonts and graphics available in one click",
    ],
    url: "https://www.canva.com",
    gradient: "from-[#7D2AE8] via-[#00C4CC] to-[#6420FF]",
    softGradient: "from-[#7D2AE8]/15 via-white to-[#00C4CC]/15",
    category: "Design",
    icon: CanvaIcon,
  },
  {
    id: "figma",
    name: "Figma",
    tagline: "Live-sync design frames & components",
    description:
      "Connect Figma to live-sync design frames, vector assets and UI components. Instantly convert static designs into interactive UI components inside VedaApex.",
    features: [
      "Import frames, layers and vector assets",
      "Convert static designs into interactive UI",
      "Keep design tokens in sync in real time",
    ],
    url: "https://www.figma.com",
    gradient: "from-[#F24E1E] via-[#A259FF] to-[#1ABCFE]",
    softGradient: "from-[#F24E1E]/15 via-white to-[#1ABCFE]/15",
    category: "Design",
    icon: FigmaIcon,
  },
  {
    id: "slack",
    name: "Slack",
    tagline: "Share work & automate alerts in channels",
    description:
      "Integrate Slack to automate alerts, share generated UI codes and receive design reviews directly from your Slack workspace channels.",
    features: [
      "Automate deployment and status alerts",
      "Share generated UI codes with your team",
      "Receive design reviews in Slack channels",
    ],
    url: "https://slack.com",
    gradient: "from-[#E01E5A] via-[#ECB22E] to-[#2EB67D]",
    softGradient: "from-[#E01E5A]/15 via-[#ECB22E]/10 to-[#2EB67D]/15",
    category: "Dev",
    icon: SlackIcon,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    tagline: "Browse, open & save files from Drive",
    description:
      "Browse, open and save files straight from your Drive. Sync documents, images and assets directly into your VedaApex workspace.",
    features: [
      "Open documents and images directly from Drive",
      "Save VedaApex outputs back to Drive",
      "Keep assets synced across your workspace",
    ],
    url: "https://drive.google.com",
    gradient: "from-[#4285F4] to-[#34A853]",
    softGradient: "from-[#4285F4]/15 via-white to-[#34A853]/15",
    category: "Google",
    icon: GoogleDriveIcon,
  },
  {
    id: "google-photos",
    name: "Google Photos",
    tagline: "Your photo library, always in reach",
    description:
      "Access your photo library for designs and inspiration. Pull in photos directly while designing inside VedaApex.",
    features: [
      "Pull photos directly into your designs",
      "Search your entire photo library",
      "Backup generated media automatically",
    ],
    url: "https://photos.google.com",
    gradient: "from-[#4285F4] via-[#EA4335] to-[#FBBC04]",
    softGradient: "from-[#4285F4]/15 via-white to-[#EA4335]/15",
    category: "Google",
    icon: GooglePhotosIcon,
  },
  {
    id: "github",
    name: "GitHub",
    tagline: "Sync repos & manage workflows",
    description:
      "Sync repositories, manage pull requests and deploy workflows. Share your generated code straight to GitHub.",
    features: [
      "Sync repositories with your workspace",
      "Manage pull requests and issues",
      "Deploy workflows directly from VedaApex",
    ],
    url: "https://github.com",
    gradient: "from-slate-400 to-slate-600",
    softGradient: "from-slate-200 via-white to-slate-100",
    category: "Dev",
    icon: GitHubIcon,
    logoClassName: "dark:invert",
  },
  {
    id: "notion",
    name: "Notion",
    tagline: "Docs, wikis & databases in your workflow",
    description:
      "Bring your docs, wikis and databases into your workflow. Export VedaApex outputs directly into your Notion workspace.",
    features: [
      "One-click exports directly to Notion",
      "Sync docs, wikis and databases",
      "Keep project knowledge in one place",
    ],
    url: "https://www.notion.so",
    gradient: "from-slate-400 to-slate-600",
    softGradient: "from-slate-200 via-white to-slate-100",
    category: "Storage",
    icon: NotionIcon,
    logoClassName: "dark:invert",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    tagline: "Files & folders, always connected",
    description:
      "Sync files and folders from your Dropbox account. Keep your design assets in one connected place.",
    features: [
      "Sync files from your Dropbox account",
      "Keep design assets in one connected place",
      "Share folders directly from VedaApex",
    ],
    url: "https://www.dropbox.com",
    gradient: "from-[#0061FF] to-[#7B9FFF]",
    softGradient: "from-[#0061FF]/15 via-white to-[#7B9FFF]/15",
    category: "Storage",
    icon: DropboxIcon,
  },
];

export const STORAGE_KEY = "vedaapex-connectors";

export function loadConnections(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (error) {
    console.error("Failed to load connectors snapshot", error);
  }
  return {};
}

export function saveConnections(map: Record<string, string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getConnectorById(id: string): Connector | undefined {
  return CONNECTORS.find((c) => c.id === id);
}
