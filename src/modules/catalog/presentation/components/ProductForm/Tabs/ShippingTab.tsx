import { FormInput } from "../FormInput";
import { Label } from "@/components/ui/label";

export function ShippingTab() {
  return (
    <div className="space-y-8 max-w-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Peso (kg)"
          type="number"
          step="0.01"
          name="weight"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Dimensiones L x A x H (cm)
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <FormInput
            label=""
            placeholder="L"
            name="length"
            type="number"
            step="0.01"
          />
          <FormInput
            label=""
            placeholder="A"
            name="width"
            type="number"
            step="0.01"
          />
          <FormInput
            label=""
            placeholder="H"
            name="height"
            type="number"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
}
