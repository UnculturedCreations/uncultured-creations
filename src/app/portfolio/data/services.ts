import { LucideIcon } from "lucide-react";

interface Service {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
}

// Import only the icons you use
import {
  Monitor,
  Code,
  Smartphone,
  Tag,
  LayoutDashboard,
  PenTool,
  Share,
  BookOpen,
  TrendingUp,
  Server,
  Lightbulb
} from "lucide-react";

export const services: Service[] = [
  {
    title: "Web Design",
    description: "Crafting visually stunning, responsive websites that reflect your brand identity and engage users.",
    icon: Monitor,
    color: "text-blue-500",
    category: "Design & Branding",
  },
  {
    title: "Web App Development",
    description: "Building dynamic web applications using modern frameworks for scalable and efficient solutions.",
    icon: Code,
    color: "text-green-500",
    category: "Development & Technology",
  },
  {
    title: "Mobile App Development",
    description: "Creating native and cross-platform mobile applications for iOS and Android with a seamless user experience.",
    icon: Smartphone,
    color: "text-pink-500",
    category: "Development & Technology",
  },
  {
    title: "Branding",
    description: "Establishing memorable brand identities with logos, color palettes, and strategic visual elements.",
    icon: Tag,
    color: "text-purple-500",
    category:"Design & Branding",
  },
  {
    title: "UI/UX Design",
    description: "Designing intuitive user interfaces and experiences to delight users and improve interaction.",
    icon: LayoutDashboard,
    color: "text-yellow-500",
    category: "Design & Branding",
  },
  {
    title: "Graphic Design",
    description: "Developing custom graphics and visual assets that effectively communicate your message.",
    icon: PenTool,
    color: "text-red-500",
    category: "Design & Branding",
  },
  {
    title: "Social Media Toolkits",
    description: "Providing branded templates and assets to boost engagement across social media platforms.",
    icon: Share,
    color: "text-indigo-500",
    category: "Design & Branding",
  },
  {
    title: "Software Development Tutorials",
    description: "Offering step-by-step guides and tutorials to help developers learn new technologies.",
    icon: BookOpen,
    color: "text-cyan-500",
    category: "Strategy & Education",
  },
  {
    title: "SEO Optimization",
    description: "Optimizing website content and structure to improve search engine visibility and drive traffic.",
    icon: TrendingUp,
    color: "text-lime-500",
    category: "Development & Technology",
  },
  {
    title: "CMS Integration",
    description: "Setting up and customizing content management systems (like WordPress) for easy content updates.",
    icon: Server,
    color: "text-orange-500",
    category: "Development & Technology",
  },
  {
    title: "Creative Consulting",
    description: "Providing expert advice and strategy to elevate your brand and digital projects.",
    icon: Lightbulb,
    color: "text-teal-500",
    category: "Strategy & Education",
  }
];
