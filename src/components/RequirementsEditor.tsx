"use client";

import { GameRequirements } from "@/types";
import { cpuList, gpuList } from "@/lib/hardwareData";
import AutocompleteInput from "@/components/AutocompleteInput";

interface Props {
  minimum: GameRequirements | null;
  recommended: GameRequirements | null;
  onChange: (min: GameRequirements, rec: GameRequirements) => void;
  onSubmit: () => void;
}

const emptyReqs: GameRequirements = {
  os: "",
  cpu: "",
  gpu: "",
  ram: "",
  storage: "",
};

const FIELDS: { key: keyof GameRequirements; label: string }[] = [
  { key: "os", label: "OS" },
  { key: "cpu", label: "Processor" },
  { key: "gpu", label: "Graphics" },
  { key: "ram", label: "Memory" },
  { key: "storage", label: "Storage" },
];

export default function RequirementsEditor({
  minimum,
  recommended,
  onChange,
  onSubmit,
}: Props) {
  const min = minimum ?? emptyReqs;
  const rec = recommended ?? emptyReqs;

  function updateMin(key: keyof GameRequirements, value: string) {
    onChange({ ...min, [key]: value }, rec);
  }

  function updateRec(key: keyof GameRequirements, value: string) {
    onChange(min, { ...rec, [key]: value });
  }

  function clearAll() {
    onChange({ ...emptyReqs }, { ...emptyReqs });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  }

  function renderField(
    key: keyof GameRequirements,
    label: string,
    value: string,
    onFieldChange: (val: string) => void
  ) {
    if (key === "cpu") {
      return (
        <AutocompleteInput
          value={value}
          onChange={onFieldChange}
          onSubmit={onSubmit}
          options={cpuList}
          placeholder={label}
        />
      );
    }
    if (key === "gpu") {
      return (
        <AutocompleteInput
          value={value}
          onChange={onFieldChange}
          onSubmit={onSubmit}
          options={gpuList}
          placeholder={label}
        />
      );
    }
    return (
      <input
        type="text"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onFieldChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={label}
      />
    );
  }

  const columns = [
    { title: "Minimum", values: min, update: updateMin },
    { title: "Recommended", values: rec, update: updateRec },
  ];

  return (
    <section className="card w-full max-w-full overflow-visible">
      <div className="card-body gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Game requirements</h2>
            <p className="mt-1 text-sm text-base-content/60">Edit these if the listed specs look off.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
          {columns.map(({ title, values, update }) => (
            <div key={title} className="flex flex-col gap-3">
              <h3 className="eyebrow border-b border-base-content/[0.08] pb-2">{title}</h3>
              {FIELDS.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-base-content/60">{label}</label>
                  {renderField(key, label, values[key], (v) => update(key, v))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary btn-sm px-5" onClick={onSubmit}>
            Apply changes
          </button>
        </div>
      </div>
    </section>
  );
}
