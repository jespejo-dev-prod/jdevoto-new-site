/**
 * src/modules/catalog/presentation/components/ProductForm/FormInput.tsx
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { CreateProductInput } from "@/validations/product.schemas";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: keyof CreateProductInput;
}

export function FormInput({ label, name, className, ...props }: FormInputProps) {
  const { register, formState: { errors } } = useFormContext<CreateProductInput>();
  
  const error = errors[name];

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
        {label}
      </Label>
      <Input
        className={cn(
          "bg-zinc-950 border-zinc-800 h-12 text-white transition-all focus:border-primary/50",
          error && "border-red-500/50 focus:border-red-500",
          className
        )}
        {...register(name as any)} // still need a small cast here if name is dynamic but it's safe
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-bold uppercase">
          {String(error.message || '')}
        </span>
      )}
    </div>
  );
}
