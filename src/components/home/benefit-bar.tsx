import { Truck, Clock, ShieldCheck, Building2 } from 'lucide-react';

export function BenefitBar() {
  const items = [
    {
      icon: Truck,
      title: 'Flete Incluido',
      desc: 'En pedidos mayoristas seleccionados',
    },
    {
      icon: Clock,
      title: 'Despacho Rápido',
      desc: 'Despacho prioritario en 24/48 hrs',
    },
    {
      icon: ShieldCheck,
      title: 'Garantía y Soporte',
      desc: 'Respaldado por soporte corporativo',
    },
    {
      icon: Building2,
      title: 'Convenios B2B',
      desc: 'Precios por volumen y líneas de crédito',
    },
  ];

  return (
    <section className="bg-white border border-zinc-200/50 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] py-6 px-8 my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 lg:px-6 ${
              idx === 0 ? 'lg:pl-2' : ''
            } ${idx > 0 ? 'pt-4 sm:pt-0 lg:pt-0' : ''}`}
          >
            <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
              <item.icon className="h-5 w-5 text-zinc-700" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider leading-none mb-1">
                {item.title}
              </h4>
              <p className="text-[10px] font-semibold text-zinc-400 leading-tight">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
