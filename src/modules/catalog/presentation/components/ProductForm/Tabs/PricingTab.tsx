import { FormInput } from "../FormInput";
import { useFormContext, useWatch } from "react-hook-form";
import { CreateProductInput } from "@/validations/product.schemas";

export function PricingTab() {
  const { control } = useFormContext<CreateProductInput>();
  
  // Optimización: useWatch solo rerenderiza esta parte específica del componente
  const basePrice = useWatch({
    control,
    name: "basePrice",
  }) || 0;

  const grossPrice = Math.round(Number(basePrice) * 1.19);

  return (
    <div className="space-y-6 max-w-lg">
      <FormInput
        label="SKU / Código de Producto"
        placeholder="Ej: PROD-001"
        name="sku"
      />
      
      <FormInput
        label="Precio Neto Referencial ($)"
        type="number"
        name="basePrice"
      />
      <div className="text-[10px] text-primary font-bold -mt-4">
        IVA 19%: ${grossPrice.toLocaleString()}
      </div>
    </div>
  );
}
