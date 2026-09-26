import { GameRequirements } from "@/types";

interface Props {
  title: string;
  requirements: GameRequirements | null;
}

const FIELDS: { key: keyof GameRequirements; label: string }[] = [
  { key: "os", label: "OS" },
  { key: "cpu", label: "Processor" },
  { key: "gpu", label: "Graphics" },
  { key: "ram", label: "Memory" },
  { key: "storage", label: "Storage" },
];

export default function RequirementsCard({ title, requirements }: Props) {
  const rows = requirements ? FIELDS.filter(({ key }) => requirements[key]) : [];

  return (
    <section className="card overflow-hidden">
      <h3 className="border-b border-base-content/[0.08] px-5 py-3.5 font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-base-content/50">Not listed</p>
      ) : (
        <dl className="divide-y divide-base-content/[0.06] text-sm">
          {rows.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-5 py-3">
              <dt className="text-base-content/50">{label}</dt>
              <dd className="break-words">{requirements![key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
