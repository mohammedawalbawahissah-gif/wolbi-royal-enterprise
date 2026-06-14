import Image from "next/image";
import { Hero, Section, FullSection, SectionHeading, Card, Btn, FeatureItem } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Founder",
  description: "Mohammed Awal Bawah Issah — Medical Laboratory Scientist, Technology Specialist, and founder of Wolbi Royal Enterprise.",
};

const CREDENTIALS = [
  { icon: "🔬", title: "Medical Laboratory Science",   description: "Professionally trained and practised in clinical laboratory diagnostics — the direct foundation for NeomatCare and Wolbi Medical Services." },
  { icon: "💻", title: "Technology Specialist",        description: "Full-stack expertise across Django REST Framework, React, React Native, PostgreSQL, and cloud infrastructure." },
  { icon: "🏥", title: "Healthcare Systems",           description: "Direct experience inside Ghanaian health facilities informed every design decision in NeomatCare's referral and case management workflows." },
  { icon: "🌾", title: "Agritech",                     description: "FarmaSyst emerged from Mohammed's close observation of the credit access and supply chain gaps facing smallholder farmers across Ghana." },
  { icon: "🏗️", title: "Enterprise Architecture",      description: "MAGHAZ Assist was designed by someone who understood both the operational complexity of built-environment businesses and the software to resolve it." },
  { icon: "🤲", title: "Community Commitment",         description: "The Foundation is personal — health, education, and youth empowerment are not abstract causes for Mohammed, but lived priorities that shaped his entire career." },
  { icon: "💻", title: "Virtual Solutions",            description: "Wolbi Virtual Solutions division offers professional remote staffing and business operations support." },
  { icon: "💼", title: "Freelancing",                  description: "Before founding Wolbi, Mohammed built software solutions for clients across industries — from custom CRMs to e-commerce platforms." }
];

export default function FounderPage() {
  return (
    <>
      <Hero
        eyebrow="The Founder"
        title="Mohammed Awal Bawah Issah"
        subtitle="Medical Laboratory Scientist. Technology Specialist. Founder of Wolbi Royal Enterprise. Building Africa's future from the inside out — from Tamale, Ghana."
        cta={{ href: "/about", label: "About the Enterprise" }}
        cta2={{ href: "/contact", label: "Connect with Mohammed" }}
      />

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "72px", alignItems: "start" }}>

          {/* Photo column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "96px" }}>
            <div style={{
              width: "100%", borderRadius: "20px", overflow: "hidden",
              boxShadow: "var(--shadow-lg)", aspectRatio: "3/4", position: "relative",
            }}>
              <Image
                src="/founder-primary.jpg"
                alt="Mohammed Awal Bawah Issah — Founder of Wolbi Royal Enterprise"
                fill
                style={{ objectFit: "cover", objectPosition: "top center" }}
                priority
                sizes="360px"
              />
            </div>

            <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "24px", border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 800, fontSize: "16px", marginBottom: "2px" }}>Mohammed Awal Bawah Issah</p>
              <p style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Founder & CEO, Wolbi Royal Enterprise</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Based in",  value: "Tamale, Ghana" },
                  { label: "Training",  value: "Medical Laboratory Science" },
                  { label: "Craft",     value: "Technology Specialist" },
                  { label: "Products",  value: "NeomatCare · FarmaSyst · MAGHAZ Assist" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: "10px", fontSize: "13px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--muted)", minWidth: "64px", flexShrink: 0 }}>{label}</span>
                    <span style={{ color: "var(--foreground)", fontWeight: 500, lineHeight: 1.5 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Story column */}
          <div>
            <SectionHeading eyebrow="Background" title="Two disciplines. One deliberate decision." />
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                "Mohammed Awal Bawah Issah is a Medical Laboratory Scientist and Technology Specialist — and the combination is not coincidental. He made a deliberate choice not to choose between the two, and built Wolbi Royal Enterprise on the conviction that the most impactful technology is built by people who have worked inside the systems they are trying to improve.",
                "NeomatCare was not designed from the outside in. It was designed by Mohammed — someone who had sat in the facilities where maternal referrals go wrong, who understood the institutional constraints and the human stakes, and who then wrote the code.",
                "FarmaSyst followed the same pattern — observation before implementation, a discipline Mohammed borrowed directly from clinical science. MAGHAZ Assist followed the same pattern. Every product he has built is the result of listening first.",
                "Based in Tamale, Mohammed works at the heart of a region where the gap between available technology and real operational need is most visible — and most consequential. That proximity is a competitive advantage, not a limitation.",
                "The Foundation is not a corporate social responsibility appendage. It reflects Mohammed's personal conviction that the communities producing our clients and users deserve the same quality of investment as any commercial vertical.",
              ].map((p, i) => (
                <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8 }}>{p}</p>
              ))}
            </div>

            <Card style={{ padding: "28px", marginTop: "32px" }}>
              <p style={{ fontSize: "15px", fontStyle: "italic", color: "var(--foreground)", lineHeight: 1.8 }}>
                "The systems that most need fixing are the ones where no one who built the technology ever had to use it. I decided that would not be true of anything we build at Wolbi."
              </p>
              <p style={{ marginTop: "16px", fontWeight: 700, fontSize: "13px", color: "var(--accent)" }}>
                — Mohammed Awal Bawah Issah
              </p>
            </Card>

            <div style={{ marginTop: "40px", borderRadius: "16px", overflow: "hidden", position: "relative", height: "340px", boxShadow: "var(--shadow-md)" }}>
              <Image
                src="/founder-secondary.jpg"
                alt="Mohammed Awal Bawah Issah"
                fill
                style={{ objectFit: "cover", objectPosition: "top center" }}
                sizes="(max-width: 900px) 100vw, 700px"
              />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)", padding: "24px" }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>Mohammed Awal Bawah Issah</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Founder & CEO · Wolbi Royal Enterprise · Tamale, Ghana</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <FullSection style={{ background: "var(--muted-bg)" }}>
        <SectionHeading eyebrow="Expertise" title="The disciplines behind the enterprise." center />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {CREDENTIALS.map((c) => (
            <Card key={c.title}>
              <FeatureItem icon={c.icon} title={c.title} description={c.description} />
            </Card>
          ))}
        </div>
      </FullSection>

      <FullSection style={{ background: "var(--primary)", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: "16px", letterSpacing: "-0.5px" }}>
          Want to collaborate with Mohammed?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", marginBottom: "32px" }}>
          Whether it's a project, a partnership, or a conversation — reach out directly.
        </p>
        <Btn href="/contact" variant="primary">Get in Touch <ArrowRight size={14} /></Btn>
      </FullSection>
    </>
  );
}
