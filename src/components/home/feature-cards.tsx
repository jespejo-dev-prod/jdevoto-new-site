import { Truck, UserPlus, ShieldCheck, Grid } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Envío Gratis',
    description: 'En algunas zonas por compras sobre $50.000',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: UserPlus,
    title: 'Ingresa a tu cuenta',
    description: 'Disfruta de ofertas y descuentos especiales',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Medios de Pago Seguros',
    description: 'Crédito B2B, Débito o Transferencia',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Grid,
    title: 'Descubre Nuestras Categorías',
    description: 'Miles de productos industriales',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
];

export function FeatureCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
      {features.map((feature, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group flex items-start gap-4"
        >
          <div className={`h-12 w-12 rounded-2xl ${feature.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
            <feature.icon className={`h-6 w-6 ${feature.color}`} />
          </div>
          <div>
            <h3 className="font-black text-zinc-900 leading-tight mb-1">{feature.title}</h3>
            <p className="text-xs font-medium text-zinc-500 leading-snug">{feature.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
