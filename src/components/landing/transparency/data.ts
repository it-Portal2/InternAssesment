import { Sparkles, Users, FileText } from "lucide-react";

export const videos = [
  {
    url: "https://res.cloudinary.com/dvparynza/video/upload/so_30,eo_60/v1765466317/interview-recordings/interview-recordings/interview_Jagan_Mohan_Reddy_1765466308026.webm",
    icon: Sparkles,
    title: "AI Voice Agent",
    subtitle: "Lip-syncing to automated responses",
    featured: true,
  },
  {
    url: "https://res.cloudinary.com/dvparynza/video/upload/so_0,eo_75/v1765459989/interview-recordings/interview-recordings/interview_Giridhar_J_1765459978225.webm",
    icon: Users,
    title: "Hidden Helper",
    subtitle: "Second person behind camera",
    featured: false,
  },
  {
    url: "https://res.cloudinary.com/dvparynza/video/upload/so_60,eo_100/v1767710314/interview-recordings/interview-recordings/interview_adviti_gangwar_1767710267342.webm",
    icon: FileText,
    title: "Script Reader",
    subtitle: "We need problem solvers, not teleprompter readers",
    featured: false,
  },
];

export const emailAlerts = [
  {
    image: "/email-alert-1.png",
    title: "Tab Switching Detected",
    description: "Multiple tab switches during interview",
  },
  {
    image: "/email-alert-2.png",
    title: "External Resource Access",
    description: "Attempt to access external resources",
  },
  {
    image: "/email-alert-3.png",
    title: "Suspicious Activity",
    description: "Multiple violations flagged",
  },
  {
    image: "/email-alert-4.png",
    title: "Session Terminated",
    description: "Interview ended due to policy violation",
  },
  {
    image: "/email-alert-5.png",
    title: "AI Detection Alert",
    description: "Potential AI assistance detected",
  },
];
