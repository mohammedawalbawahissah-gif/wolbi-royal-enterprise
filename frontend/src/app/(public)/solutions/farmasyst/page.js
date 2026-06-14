import ProductPage from "@/components/sections/ProductPage";

export const metadata = { title: "FarmaSyst", description: "Agricultural management, credit access, and marketplace platform for Ghanaian farmers." };

export default function FarmaSystPage() {
  return (
    <ProductPage
      name="FarmaSyst"
      industry="Agriculture"
      color="#16a34a"
      hero={{
        eyebrow: "FarmaSyst",
        title: "The agricultural management system built for Ghanaian farmers.",
        subtitle: "From farm records and credit applications to marketplace listings and disbursement tracking — FarmaSyst is the operational backbone for smallholder farmers and agribusinesses.",
        cta: { href: "#demo", label: "Request a Demo" },
        cta2: { href: "/divisions/technologies", label: "Wolbi Technologies" },
      }}
      overview={{
        title: "Agriculture software that understands the Ghanaian context.",
        paragraphs: [
          "Access to credit is the single biggest constraint on smallholder agricultural productivity in Ghana. Farmers cannot invest in inputs, equipment, or storage because formal credit systems do not understand their risk profile — and the data to demonstrate that profile doesn't exist in a form lenders can use.",
          "FarmaSyst creates that data layer. It tracks farm activities, yield histories, and financial flows in a structured format that enables both internal risk assessment and third-party credit decisions.",
          "The platform also includes a marketplace for agricultural produce — connecting buyers and sellers with payment option flexibility, including instant payment and cash on delivery — and a disbursement workflow for agricultural credit schemes.",
        ],
      }}
      targetUsers={["Smallholder Farmers", "Agribusinesses", "Agricultural Lenders", "Input Suppliers", "Commodity Buyers", "Extension Officers"]}
      features={[
        { icon: "🌾", title: "Farm Management", description: "Record-keeping for plots, crops, inputs, activities, and yields — structured for credit assessment." },
        { icon: "💳", title: "Credit Application & Workflow", description: "Farmers apply, lenders assess, and disbursements are tracked through a single managed workflow." },
        { icon: "📦", title: "Agricultural Marketplace", description: "List and sell produce with flexible payment options: instant payment or cash on delivery." },
        { icon: "🥚", title: "Product-specific Fields", description: "Commodity-specific data fields — including egg size grading for poultry — for accurate listings." },
        { icon: "📊", title: "Repayment Schedules", description: "Auto-generated repayment plans with tracking against actual disbursement and recovery." },
        { icon: "🤝", title: "Farmer Contracts Portal", description: "Formalise and manage offtake agreements, service contracts, and supply arrangements." },
        { icon: "🔍", title: "Risk Assessment Tools", description: "Data-driven farmer risk profiles for lenders making credit decisions." },
        { icon: "📱", title: "Mobile Access", description: "Field-accessible mobile interface for farmers in areas with limited desktop connectivity." },
      ]}
      roadmap={[
        { title: "Farm management core", description: "Plot records, crop tracking, input management.", done: true },
        { title: "Credit workflow", description: "Application, assessment, approval, and disbursement.", done: true },
        { title: "Marketplace with payment options", description: "Listings, buyer discovery, and payment flexibility.", done: true },
        { title: "Satellite yield estimation", description: "Remote sensing integration to validate self-reported farm data.", done: false },
        { title: "Insurance integration", description: "Parametric crop insurance linked to farm records.", done: false },
        { title: "Cooperative management", description: "Multi-farmer cooperative structures with pooled credit applications.", done: false },
      ]}
    />
  );
}
