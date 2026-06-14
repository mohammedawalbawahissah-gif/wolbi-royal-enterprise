import ProductPage from "@/components/sections/ProductPage";

export const metadata = { title: "NeomatCare", description: "Emergency referral and maternal-neonatal care coordination system for Ghana." };

export default function NeomatCarePage() {
  return (
    <ProductPage
      name="NeomatCare"
      industry="Healthcare"
      color="#e11d48"
      hero={{
        eyebrow: "NeomatCare",
        title: "Every second counts in maternal and neonatal emergencies.",
        subtitle: "NeomatCare is a facility coordination and emergency referral system purpose-built for Ghana's maternal and neonatal healthcare pathway — from community level to tertiary facility.",
        cta: { href: "#demo", label: "Request a Demo" },
        cta2: { href: "/divisions/medical", label: "Wolbi Medical Services" },
      }}
      overview={{
        title: "The referral system Ghana's health facilities actually need.",
        paragraphs: [
          "Maternal and neonatal mortality in Ghana remains above global targets. A significant proportion of preventable deaths occur not because care is unavailable, but because the coordination between facilities breaks down — delays in referral decisions, no visibility into receiving facility capacity, no communication trail.",
          "NeomatCare addresses that coordination gap directly. It gives community health workers, midwives, district hospitals, and regional facilities a shared, real-time view of the referral pathway — so the right patient reaches the right facility at the right time.",
          "Built from the perspective of someone who has worked inside these facilities, every workflow in NeomatCare is designed around actual clinical decision-making, not hypothetical best practices.",
        ],
      }}
      targetUsers={["Community Health Workers", "Midwives & Nurses", "District Hospitals", "Regional Hospitals", "Health Administrators", "MOH Partners"]}
      features={[
        { icon: "🚑", title: "Emergency Referral Coordination", description: "Initiate, track, and receive referrals with real-time status updates across the care chain." },
        { icon: "🏥", title: "Facility Capacity Visibility", description: "Receiving facilities communicate availability so sending facilities make informed decisions, not guesses." },
        { icon: "📋", title: "Patient Case Management", description: "Full clinical case record attached to every referral — transferred automatically, not re-entered." },
        { icon: "📊", title: "ANC Visit Tracking", description: "Antenatal care visit history and risk flags travel with the patient across facilities." },
        { icon: "⚠️", title: "Automatic Risk Flagging", description: "Clinical parameters trigger risk alerts that escalate through the referral chain." },
        { icon: "📅", title: "Follow-up Scheduling", description: "Post-referral follow-up tasks are auto-generated and assigned to the responsible clinician." },
        { icon: "✍️", title: "Consent & Audit Logging", description: "Every action is logged. Every consent is recorded. Full audit trail for clinical governance." },
        { icon: "📱", title: "Mobile-first Design", description: "Built as a React Native mobile app for operation in low-connectivity field environments." },
      ]}
      roadmap={[
        { title: "Core referral workflow", description: "Initiate, accept, and complete referrals across facilities.", done: true },
        { title: "ANC visit tracker", description: "Track antenatal visits with risk flagging and outcome recording.", done: true },
        { title: "Multi-role access", description: "Distinct dashboards for CHWs, clinicians, admins, and supervisors.", done: true },
        { title: "Offline mode", description: "Full functionality in zero-connectivity environments with sync on reconnect.", done: false },
        { title: "National dashboard", description: "Aggregated referral analytics for district and national health authorities.", done: false },
        { title: "DHIMS2 integration", description: "Direct data exchange with Ghana's national health information system.", done: false },
      ]}
    />
  );
}
