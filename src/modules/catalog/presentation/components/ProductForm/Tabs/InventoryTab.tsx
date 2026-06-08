import { FormInput } from "../FormInput";

export function InventoryTab() {
  return (
    <div className="space-y-6 max-w-lg">
      <div className="grid grid-cols-2 gap-6">
        <FormInput
          label="SKU"
          className="uppercase font-mono text-primary font-bold"
          name="sku"
        />
        <FormInput
          label="Unidad de Medida (Ej: UN, BOL, KG)"
          placeholder="UN"
          className="uppercase font-bold"
          name="unit"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-800/50">
        <FormInput
          label="Stock Actual"
          type="number"
          name="stockQuantity"
        />
        <FormInput
          label="Aviso Stock Bajo"
          type="number"
          name="stockAlert"
        />
      </div>
      
      <div className="pt-6 border-t border-zinc-800/50">
        <FormInput
          label="Unidades Inner (Mínimo de Compra y Múltiplo)"
          type="number"
          name="inner"
        />
      </div>
    </div>
  );
}
