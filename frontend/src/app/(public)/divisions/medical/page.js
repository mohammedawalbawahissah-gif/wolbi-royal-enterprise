"use client";

import { useState } from "react";
import { Hero, FullSection, Section, SectionHeading, Card, Btn } from "@/components/ui";
import { ArrowRight, CheckCircle, Calendar, Phone, Mail } from "lucide-react";

// ─── Service Catalogues ───────────────────────────────────────────────────────

const LAB_CATEGORIES = {
  "Haematology": [
    "Full Blood Count (FBC)", "Blood Film Comment", "Erythrocyte Sedimentation Rate (ESR)",
    "Sickling Test", "Haemoglobin Electrophoresis", "Reticulocyte Count",
    "Prothrombin Time (PT)", "Activated Partial Thromboplastin Time (APTT)",
    "D-Dimer", "Bleeding Time / Clotting Time",
  ],
  "Clinical Chemistry": [
    "Random Blood Sugar (RBS)", "Fasting Blood Sugar (FBS)", "HbA1c",
    "Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)",
    "Liver Function Tests (LFTs) — ALT, AST, ALP, GGT, Total Bilirubin, Direct Bilirubin",
    "Kidney Function Tests (KFTs) — Urea, Creatinine, Uric Acid, eGFR",
    "Electrolytes (Na+, K+, Cl−, HCO3−)", "Serum Proteins (Total Protein, Albumin, Globulin)",
    "Calcium & Phosphate", "Magnesium", "Amylase & Lipase",
    "Cardiac Enzymes — Troponin I, CK-MB, LDH", "C-Reactive Protein (CRP)",
    "Thyroid Function Tests (TFTs) — TSH, T3, T4, Free T4",
    "Serum Iron, TIBC, Ferritin", "Serum Folate & B12",
    "PSA (Prostate Specific Antigen)", "CA-125", "AFP (Alpha-Fetoprotein)",
    "CEA (Carcinoembryonic Antigen)", "Beta-HCG (Quantitative)",
  ],
  "Microbiology": [
    "Urine Culture & Sensitivity", "Stool Culture & Sensitivity",
    "Blood Culture & Sensitivity", "Wound Swab Culture & Sensitivity",
    "High Vaginal Swab (HVS) Culture", "Throat Swab Culture",
    "Sputum Culture & Sensitivity", "Sputum for AFB (Tuberculosis)",
    "Urethral Swab for NAAT / Culture", "Ear Swab Culture",
    "Nasal Swab Culture", "Conjunctival Swab Culture",
  ],
  "Serology & Immunology": [
    "HIV 1 & 2 Antibody Test", "Hepatitis B Surface Antigen (HBsAg)",
    "Hepatitis B Surface Antibody (Anti-HBs)", "Hepatitis B Core Antibody (Anti-HBc)",
    "Hepatitis C Antibody (Anti-HCV)", "VDRL / RPR (Syphilis Screening)",
    "TPHA (Syphilis Confirmatory)", "Rheumatoid Factor (RF)",
    "Antinuclear Antibody (ANA)", "Anti-dsDNA", "ASO Titre",
    "Widal Test (Typhoid / Salmonella)", "Brucella Agglutination Test",
    "H. pylori Antigen / Antibody", "Dengue NS1 Antigen & Antibody",
    "COVID-19 Antigen / Antibody", "Pregnancy Test (Urine & Serum)",
  ],
  "Parasitology": [
    "Malaria Rapid Diagnostic Test (RDT)", "Malaria Thick & Thin Film",
    "Stool for Ova & Parasites", "Stool Routine Examination",
    "Urinalysis & Microscopy", "Kato-Katz for Schistosomiasis",
    "Skin Snip for Onchocerciasis", "Filarial Blood Film",
  ],
  "Urinalysis": [
    "Urinalysis (Routine & Microscopy)", "Urine Protein-Creatinine Ratio",
    "Urine Microalbumin", "Urine Culture & Sensitivity",
    "24-Hour Urine Protein", "Urine Pregnancy Test",
  ],
  "Histopathology & Cytology": [
    "Pap Smear (Cervical Cytology)", "Fine Needle Aspiration Cytology (FNAC)",
    "Biopsy & Histopathology", "Sputum Cytology",
    "Bone Marrow Aspirate", "Urine Cytology",
  ],
  "COVID-19 & Infectious Disease Panels": [
    "COVID-19 PCR", "COVID-19 Antigen Rapid Test",
    "Influenza A & B Rapid Test", "Respiratory Panel (Multiplex PCR)",
    "Sexually Transmitted Infection (STI) Panel",
    "TORCH Panel (Toxoplasma, Rubella, CMV, Herpes)",
  ],
};

const USG_SERVICES = {
  "Abdominal": [
    "Abdominal Ultrasound (Liver, GB, Pancreas, Spleen, Kidneys)",
    "Liver Ultrasound", "Gallbladder & Biliary System",
    "Kidney Ultrasound (Bilateral)", "Spleen Ultrasound",
    "Pancreas Ultrasound", "Abdominal Aorta Scan",
    "Abdominal Mass / Lesion Evaluation",
  ],
  "Obstetric & Gynaecological": [
    "First Trimester Scan (Viability / Dating)", "NT Scan (Nuchal Translucency — 11–14 weeks)",
    "Anomaly Scan (18–22 weeks)", "Third Trimester / Growth Scan",
    "Doppler Ultrasound (Foetal Wellbeing)", "Cervical Length Measurement",
    "Biophysical Profile (BPP)", "Placenta Localisation",
    "Pelvic Ultrasound (Uterus & Ovaries)", "Transvaginal Ultrasound (TVUS)",
    "Follicle Tracking / Ovulation Monitoring", "Fibroid Assessment",
    "Ovarian Cyst Assessment", "IUCD (Coil) Position Check",
  ],
  "Urological": [
    "Kidney, Ureter & Bladder (KUB) Scan", "Prostate Ultrasound (TAUS)",
    "Transrectal Ultrasound (TRUS) — Prostate", "Bladder Volume / Post-Void Residual",
    "Scrotal / Testicular Ultrasound", "Renal Calculi Assessment",
  ],
  "Musculoskeletal": [
    "Shoulder Ultrasound", "Hip Ultrasound (Paediatric & Adult)",
    "Knee Ultrasound", "Ankle & Foot Ultrasound",
    "Elbow Ultrasound", "Wrist Ultrasound",
    "Soft Tissue Lesion Assessment", "Muscle / Tendon Tear Assessment",
  ],
  "Head, Neck & Thyroid": [
    "Thyroid Ultrasound", "Parotid & Submandibular Gland Scan",
    "Cervical Lymph Node Assessment", "Soft Tissue Neck Mass",
    "Neonatal / Infant Head Ultrasound",
  ],
  "Vascular": [
    "Carotid Doppler Ultrasound", "Lower Limb Venous Doppler (DVT Screening)",
    "Lower Limb Arterial Doppler", "Upper Limb Doppler",
    "Renal Artery Doppler", "Hepatic / Portal Vein Doppler",
  ],
  "Procedural / Guided": [
    "Ultrasound-Guided FNAC", "Ultrasound-Guided Biopsy",
    "Ultrasound-Guided Aspiration", "Ultrasound-Guided Injection",
  ],
};

const DNA_TESTS = {
  "Paternity Testing": [
    "Standard DNA Paternity Test (Father vs Child)",
    "Paternity Test with Mother's Sample Included",
    "Court-Admissible / Legal Paternity Test",
    "Prenatal Paternity Test (Non-Invasive — NIPP)",
    "Grandparentage DNA Test",
    "Sibling DNA Test (Full / Half Sibling Analysis)",
    "Avuncular DNA Test (Uncle / Aunt vs Niece / Nephew)",
    "Twin Zygosity Test (Identical vs Fraternal)",
  ],
  "Maternity & Family Relationship": [
    "DNA Maternity Test", "Immigration DNA Test (Embassy / GIS Accepted)",
    "Ancestry / Biological Relationship Test", "Extended Family Relationship Test",
  ],
  "Forensic & Legal": [
    "Forensic DNA Analysis (Hair, Blood, Saliva, Tissue)",
    "Chain of Custody DNA Sample Collection",
    "DNA Profiling & Banking",
    "Deceased Paternity / Post-Mortem DNA Test",
  ],
  "Genetic Health Screening": [
    "Sickle Cell Genotype Confirmation (DNA-level)", "Carrier Screening",
    "Hereditary Disease Panel", "Pharmacogenomics (Drug Response) Test",
  ],
};

const HEALTH_ADVISORY = {
  "Laboratory & Diagnostic Advisory": [
    "Laboratory Quality Management System (QMS) Setup",
    "ISO 15189 Accreditation Preparation",
    "Laboratory Workflow Optimisation",
    "Standard Operating Procedure (SOP) Development",
    "Equipment Procurement & Evaluation Advisory",
    "Quality Control (QC) & Quality Assurance (QA) Systems",
    "Laboratory Safety & Infection Control Advisory",
    "External Quality Assessment (EQA) Programme Support",
  ],
  "Clinical & Health System Advisory": [
    "Health Facility Assessment & Gap Analysis",
    "Health System Design & Restructuring",
    "Clinical Protocol & Guideline Development",
    "Patient Flow & Triage Optimisation",
    "Maternal & Neonatal Health Programme Design",
    "Community Health Programme Advisory",
    "Primary Healthcare Strengthening",
    "Referral System Design & Implementation",
  ],
  "Digital Health & Technology Advisory": [
    "NeomatCare Deployment & Integration Support",
    "Health Information System (HIS) Advisory",
    "Electronic Medical Records (EMR) Implementation Support",
    "DHIMS2 Data Management & Reporting",
    "Telehealth Framework Design",
    "mHealth Strategy Development",
    "Health Data Analytics & Reporting",
  ],
  "Training & Capacity Building": [
    "Laboratory Staff Training & Competency Assessment",
    "Clinical Staff In-service Training",
    "Health Data Management Training",
    "Community Health Worker Training Support",
    "Medical Documentation & Record-Keeping Training",
  ],
  "Research & Evidence Advisory": [
    "Clinical Research Protocol Development",
    "Health Research Ethics Advisory",
    "Data Collection Tool Design",
    "Publication & Research Writing Support",
    "Systematic Review & Literature Analysis",
  ],
};

const TELEHEALTH_SERVICES = {
  "Remote Consultations": [
    "General Health Consultation (Video / Phone)",
    "Laboratory Result Interpretation Consultation",
    "Post-Diagnostic Follow-up Consultation",
    "Second Opinion Consultation",
    "Medication Review Consultation",
    "Chronic Disease Management Consultation (Diabetes, Hypertension, etc.)",
    "Mental Health Support Triage & Referral",
    "Maternal Health Remote Consultation",
    "Paediatric Health Remote Consultation",
  ],
  "Telehealth Programme Support": [
    "Telehealth Framework Design for Organisations",
    "Remote Patient Monitoring Programme Setup",
    "Digital Health Workflow Integration",
    "Virtual Ward Round Support",
    "Teleconsultation SOP Development",
    "Platform Selection & Implementation Advisory",
  ],
  "Health Education & Coaching": [
    "Nutritional Counselling (Remote)",
    "Lifestyle & Wellness Coaching",
    "Chronic Disease Self-Management Education",
    "Pre- & Post-Natal Health Education",
    "Sexual & Reproductive Health Education",
    "Mental Health First Aid & Psychoeducation",
  ],
  "Referral & Care Coordination": [
    "Care Coordination & Referral Management",
    "Follow-up Care Scheduling",
    "Multi-disciplinary Team (MDT) Coordination Support",
    "Discharge Planning & Home Care Advisory",
  ],
};

// ─── Shared Booking Modal ─────────────────────────────────────────────────────

function BookingModal({ service, onClose }) {
  const [selectedService, setSelectedService] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", preferred_date: "", notes: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pick catalogue for this service
  const catalogue =
    service.bookingType === "LAB"       ? LAB_CATEGORIES :
    service.bookingType === "USG"       ? USG_SERVICES :
    service.bookingType === "DNA"       ? DNA_TESTS :
    service.bookingType === "ADVISORY"  ? HEALTH_ADVISORY :
    service.bookingType === "TELEHEALTH"? TELEHEALTH_SERVICES : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/leads/`,
        {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, email: form.email, phone: form.phone,
            subject: `Service Booking: ${service.name}${selectedService ? " — " + selectedService : ""}`,
            message: `Service: ${service.name}\nSpecific Test/Service: ${selectedService || "Not specified"}\nPreferred Date: ${form.preferred_date || "Flexible"}\n\nAdditional Notes:\n${form.notes}`,
            inquiry_type: "MEDICAL",
            product_interest: service.bookingType,
          }),
        }
      );
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: "14px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--card-bg)", borderRadius: "20px", padding: "36px", maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircle size={52} color="var(--accent)" style={{ margin: "0 auto 16px", display: "block" }} />
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Booking Request Received</h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              We'll confirm your appointment within one business day. Check your email for a response.
            </p>
            <button onClick={onClose} style={{ padding: "10px 28px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: service.color, marginBottom: "4px" }}>Book a Service</p>
                <h3 style={{ fontSize: "19px", fontWeight: 800 }}>{service.name}</h3>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "22px", lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={submit}>
              {/* Service selector */}
              {catalogue && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 700 }}>
                    Select Specific {service.bookingType === "LAB" ? "Test" : service.bookingType === "USG" ? "Scan" : service.bookingType === "DNA" ? "Test" : "Service"} *
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    style={{ ...inp, cursor: "pointer" }}
                    required
                  >
                    <option value="">— Choose from list —</option>
                    {Object.entries(catalogue).map(([category, items]) => (
                      <optgroup key={category} label={`── ${category} ──`}>
                        {items.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                    Don't see what you need? Describe it in the notes below.
                  </p>
                </div>
              )}

              {/* Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} required />
                </div>
              </div>

              {/* Phone + Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Phone Number *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Preferred Date</label>
                  <input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} style={inp} />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3} style={inp}
                  placeholder="Any symptoms, clinical history, referral information, or special requirements..."
                />
              </div>

              {status === "error" && (
                <p style={{ color: "#ef4444", marginBottom: "14px", fontSize: "13px" }}>Something went wrong. Please try again or call us directly.</p>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "13px", background: service.color, color: "#fff",
                  border: "none", borderRadius: "9px", fontWeight: 700, fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <Calendar size={15} /> {loading ? "Submitting…" : "Submit Booking Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: "🧪", name: "Laboratory Diagnostic Services", bookingType: "LAB", color: "#e11d48",
    description: "Comprehensive diagnostic testing across haematology, biochemistry, microbiology, serology, parasitology, cytology, and more. Results delivered with clinical accuracy and professional interpretation.",
    features: ["Haematology & Blood Science", "Clinical Chemistry Panels", "Microbiology & Culture", "Serology & Immunology", "Parasitology & Malaria", "Histopathology & Cytology"],
  },
  {
    icon: "📡", name: "USG Scan Services", bookingType: "USG", color: "#7c3aed",
    description: "Ultrasound scanning services covering abdominal, obstetric, gynaecological, urological, musculoskeletal, vascular, and guided procedural imaging.",
    features: ["Obstetric & Pregnancy Scans", "Abdominal & Pelvic Imaging", "Thyroid & Neck Scans", "Vascular Doppler Studies", "Musculoskeletal Assessment", "Procedural Guidance"],
  },
  {
    icon: "🧬", name: "DNA Paternity Testing", bookingType: "DNA", color: "#0ea5e9",
    description: "Confidential, court-admissible DNA testing covering paternity, maternity, sibling, immigration, forensic, and genetic health screening.",
    features: ["Standard & Legal Paternity Tests", "Immigration DNA Tests", "Sibling & Grandparentage Tests", "Prenatal Paternity (Non-Invasive)", "Forensic DNA Analysis", "Genetic Health Screening"],
  },
  {
    icon: "📋", name: "Health Advisory & Consulting", bookingType: "ADVISORY", color: "#16a34a",
    description: "Strategic consulting for health organisations, facilities, and professionals across laboratory QMS, clinical protocol development, digital health, and research.",
    features: ["Laboratory QA & QMS Setup", "ISO 15189 Preparation", "Clinical Protocol Development", "Digital Health Advisory", "NeomatCare Integration", "Research & Evidence Support"],
  },
  {
    icon: "📱", name: "Telehealth Support", bookingType: "TELEHEALTH", color: "#1e3a5f",
    description: "Remote health consultations, chronic disease management, health education, telehealth programme design, and care coordination — accessible from anywhere.",
    features: ["General & Specialist Remote Consultations", "Lab Result Interpretation", "Chronic Disease Management", "Maternal & Paediatric Health", "Telehealth Programme Design", "Health Coaching & Education"],
  },
];

function ServiceCard({ service }) {
  const [showBooking, setShowBooking] = useState(false);
  return (
    <>
      <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <div style={{ height: "5px", background: service.color }} />
        <div style={{ padding: "28px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "32px", marginBottom: "14px" }}>{service.icon}</div>
          <p style={{ fontWeight: 700, fontSize: "17px", marginBottom: "10px" }}>{service.name}</p>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>{service.description}</p>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px", flex: 1 }}>
            {service.features.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>
                <CheckCircle size={13} color={service.color} style={{ flexShrink: 0 }} /> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowBooking(true)}
            style={{ width: "100%", padding: "12px", background: service.color, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Calendar size={14} /> Book This Service
          </button>
        </div>
      </div>
      {showBooking && <BookingModal service={service} onClose={() => setShowBooking(false)} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MedicalPage() {
  return (
    <>
      <Hero
        eyebrow="Wolbi Medical Services"
        title="Clinical expertise you can engage — without the institutional overhead."
        subtitle="Laboratory diagnostics, USG scanning, DNA testing, health advisory, and telehealth — delivered by practitioners who have worked inside the systems they serve."
        cta={{ href: "/schedule", label: "Schedule a Call" }}
        cta2={{ href: "/contact", label: "Request a Consultation" }}
      />

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px" }}>
          <div>
            <SectionHeading eyebrow="About" title="Healthcare services from the inside out." />
            {[
              "Wolbi Medical Services exists because Mohammed Awal Bawah Issah is a practising Medical Laboratory Scientist — not because it was an attractive market. That distinction determines how the division operates.",
              "Our services span clinical diagnostics, imaging, genetic testing, and health advisory — all delivered with the rigour of a professional who has run samples, written reports, and navigated Ghanaian health facilities firsthand.",
              "We also serve as the institutional bridge for NeomatCare deployments — supporting onboarding, training, and operational integration for health facilities adopting the platform.",
            ].map((p, i) => (
              <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>{p}</p>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Book Online */}
            <Card style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                <div style={{ color: "var(--accent)", marginTop: "2px" }}><Calendar size={20} /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>Book Online</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>Choose your specific test or service from the cards below and we confirm within one business day.</p>
                </div>
              </div>
              <a href="#services" style={{ display: "inline-block", padding: "9px 18px", background: "var(--accent)", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                Browse Services Below ↓
              </a>
            </Card>

            {/* Call Us */}
            <Card style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                <div style={{ color: "var(--primary)", marginTop: "2px" }}><Phone size={20} /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>Call Us</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>Speak directly with our medical team for urgent queries or to discuss complex diagnostic needs.</p>
                </div>
              </div>
              <a href="tel:+233241597327" style={{ display: "inline-block", padding: "9px 18px", background: "var(--primary)", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                📞 Call Now
              </a>
            </Card>

            {/* Email */}
            <Card style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                <div style={{ color: "#7c3aed", marginTop: "2px" }}><Mail size={20} /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>Email Us</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>Send referral documentation, detailed queries, or clinical correspondence directly to our inbox.</p>
                </div>
              </div>
              <a href="mailto:medical@wolbiroyal.com" style={{ display: "inline-block", padding: "9px 18px", background: "#7c3aed", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                ✉️ Send Email
              </a>
            </Card>
          </div>
        </div>
      </Section>

      <FullSection style={{ background: "var(--muted-bg)" }} id="services">
        <SectionHeading
          eyebrow="Our Services"
          title="What Wolbi Medical Services offers."
          subtitle="Select a service card to book — you'll be shown a full list of available tests and consultations to choose from."
          center
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {SERVICES.map((s) => <ServiceCard key={s.name} service={s} />)}
        </div>
      </FullSection>

      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>Need a medical service?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "32px", fontSize: "16px" }}>
          Book directly above, schedule a call, or get in touch with our team.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/schedule" variant="primary">Schedule a Call <ArrowRight size={14} /></Btn>
          <Btn href="/contact" variant="ghost">Contact Us</Btn>
        </div>
      </FullSection>
    </>
  );
}
