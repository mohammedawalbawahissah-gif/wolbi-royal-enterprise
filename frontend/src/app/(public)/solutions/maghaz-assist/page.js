import ProductPage from "@/components/sections/ProductPage";

export const metadata = { title: "MAGHAZ Assist", description: "Seven-module ERP platform for real estate, hospitality, and construction businesses." };

export default function MaghazAssistPage() {
  return (
    <ProductPage
      name="MAGHAZ Assist"
      industry="Real Estate · Hospitality · Construction"
      color="#1e3a5f"
      hero={{
        eyebrow: "MAGHAZ Assist",
        title: "Enterprise management for Africa's built environment.",
        subtitle: "A seven-module ERP platform covering real estate, hospitality, and construction — purpose-built for the operational realities of businesses in Ghana and across Africa.",
        cta: { href: "#demo", label: "Request a Demo" },
        cta2: { href: "/divisions/technologies", label: "Wolbi Technologies" },
      }}
      overview={{
        title: "One platform. Three industries. Seven integrated modules.",
        paragraphs: [
          "Real estate developers, hotel operators, and construction companies in Ghana share a common operational challenge: they are managing complex, multi-stakeholder businesses with fragmented tools — spreadsheets, WhatsApp, paper-based systems, and disconnected software.",
          "MAGHAZ Assist brings those workflows into a single, integrated platform. Each of the seven modules is independently functional but gains exponential value when connected — a property sale flows directly into the financial module; a construction project update surfaces in the client portal automatically.",
          "Designed for businesses operating at the intersection of physical assets and human operations, MAGHAZ Assist respects the specific context of its users: payment structures, regulatory requirements, and operational norms that differ from Western ERP assumptions.",
        ],
      }}
      targetUsers={["Real Estate Developers", "Property Managers", "Hotel & Hospitality Operators", "Construction Firms", "Facilities Managers", "Finance & Admin Teams"]}
      features={[
        { icon: "🏢", title: "Property Management", description: "Portfolio management, tenant records, lease tracking, and maintenance scheduling." },
        { icon: "🏨", title: "Hospitality Management", description: "Reservations, room management, F&B operations, and guest experience tracking." },
        { icon: "🏗️", title: "Construction Project Management", description: "Project timelines, contractor management, materials tracking, and milestone reporting." },
        { icon: "💰", title: "Financial Management", description: "Revenue tracking, expense management, invoicing, and financial reporting across all modules." },
        { icon: "👥", title: "HR & Payroll", description: "Staff records, attendance, leave management, and payroll processing for multi-site operations." },
        { icon: "📋", title: "CRM & Client Portal", description: "Client relationship management with a self-service portal for property buyers and tenants." },
        { icon: "📊", title: "Analytics Dashboard", description: "Unified reporting across all seven modules — occupancy rates, project progress, financial KPIs." },
      ]}
      roadmap={[
        { title: "Core ERP architecture", description: "Seven-module system with shared data layer.", done: true },
        { title: "Property and hospitality modules", description: "Full feature set for real estate and hotel management.", done: true },
        { title: "Construction project module", description: "Timeline, contractor, and materials management.", done: true },
        { title: "Mobile field access", description: "Site managers and field teams access their modules on mobile.", done: false },
        { title: "API integrations", description: "Connect with accounting software, payment gateways, and government registries.", done: false },
        { title: "Multi-currency support", description: "Operations spanning multiple African markets with currency conversion.", done: false },
      ]}
    />
  );
}
