import { Truck, Users, ShieldCheck, Layers } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Logística Especializada B2B',
    description: 'Despacho prioritario directo a faena, planta o sucursal a nivel nacional.',
    borderHover: 'hover:border-sky-500/30 group-hover:text-sky-500',
    iconColor: 'text-zinc-700 group-hover:text-sky-500',
    iconBg: 'bg-zinc-50 group-hover:bg-sky-500/5',
  },
  {
    icon: Users,
    title: 'Portal de Clientes Corporativos',
    description: 'Accede a cotizaciones automáticas, líneas de crédito y precios preferenciales.',
    borderHover: 'hover:border-amber-500/30 group-hover:text-amber-500',
    iconColor: 'text-zinc-700 group-hover:text-amber-500',
    iconBg: 'bg-zinc-50 group-hover:bg-amber-500/5',
  },
  {
    icon: ShieldCheck,
    title: 'Transacciones Seguras',
    description: 'Pago contra factura, transferencias bancarias protegidas y convenios de pago.',
    borderHover: 'hover:border-emerald-500/30 group-hover:text-emerald-500',
    iconColor: 'text-zinc-700 group-hover:text-emerald-500',
    iconBg: 'bg-zinc-50 group-hover:bg-emerald-500/5',
  },
  {
    icon: Layers,
    title: 'Catálogo Certificado',
    description: 'Productos industriales homologados y garantizados bajo estándares técnicos.',
    borderHover: 'hover:border-purple-500/30 group-hover:text-purple-500',
    iconColor: 'text-zinc-700 group-hover:text-purple-500',
    iconBg: 'bg-zinc-50 group-hover:bg-purple-500/5',
  },
];

export function FeatureCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
      {features.map((feature, idx) => (
        <div 
          key={idx} 
          className={`group bg-white rounded-[28px] p-6 border border-zinc-100 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_45px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-shadow duration-300 flex flex-col justify-between gap-6 cursor-default`}
        >
          <div className="flex items-start justify-between">
            {/* Icon Wrapper with sleek borders */}
            <div className={`h-12 w-12 rounded-2xl ${feature.iconBg} border border-zinc-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-transparent transition-transform duration-300`}>
              <feature.icon className={`h-5 w-5 ${feature.iconColor} transition-colors duration-300`} />
            </div>
            {/* Minimal top border indicator on hover */}
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-200 group-hover:bg-primary transition-colors" />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 leading-tight mb-2 uppercase tracking-wide">{feature.title}</h3>
            <p className="text-xs font-semibold text-zinc-400 leading-relaxed">{feature.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
