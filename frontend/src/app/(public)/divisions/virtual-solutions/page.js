import DivisionPage from "@/components/sections/DivisionPage";

export const metadata = { title: "Wolbi Virtual Solutions", description: "Virtual assistance, administrative support, and business operations services from Wolbi Virtual Solutions." };

const config = {
  division: "VIRTUAL_SOLUTIONS",
  hero: {
    eyebrow: "Wolbi Virtual Solutions",
    title: "Professional remote capacity — without the fixed overhead.",
    subtitle: "Skilled virtual assistants and business operations specialists, rigorously selected and managed to the standards of our in-house teams.",
    cta: { href: "/contact", label: "Hire Virtual Staff" },
  },
  about: {
    title: "The operational arm that keeps everything moving.",
    paragraphs: [
      "Wolbi Virtual Solutions provides professional virtual staffing and business operations support to growing organisations that need capacity without fixed-cost headcount.",
      "Our VAs are not generalist freelancers. They are trained to operate within client systems, follow documented processes, and deliver to the same quality bar we hold our internal teams to.",
      "Services range from executive and administrative assistance to research, data management, customer communications, and project coordination.",
    ],
    highlights: [
      { icon: "📅", title: "Executive Assistance", description: "Calendar management, correspondence, research, and reporting for senior leaders." },
      { icon: "📊", title: "Business Operations", description: "Process documentation, data entry, CRM management, and operational coordination." },
      { icon: "🔍", title: "Research & Analysis", description: "Market research, competitive intelligence, and data synthesis for decision-making." },
    ],
  },
};

export default function VirtualSolutionsPage() {
  return <DivisionPage {...config} />;
}
