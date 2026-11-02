'use client';

import { services } from '../data/services';
import { categories } from '../data/categories';

export default function Services() {
  return (
    <section id="services" className="py-20 bg-base font-sans">
      <div className="container mx-auto px-4 max-w-6xl">        
        <h2 className="font-heading text-center text-4xl font-bold text-contrast border-b-2 border-accent pb-1 mb-4">
          Our Services
        </h2>
        <p className="text-center text-contrast max-w-xl mx-auto mb-12">
          Full-service creative solutions tailored to your needs — from design to development.
        </p>

        {categories.map((category) => (
          <div key={category.name} className="mb-16">
            <h3 className="text-accent font-heading text-0.7xl font-bold uppercase tracking-widest mb-2">{category.name}</h3>
              
            <h4 className="font-heading text-2xl font-bold text-contrast mb-6">{category.description}</h4>    
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.filter((service) => service.category === category.name).map((service, index) => {
                const Icon = service.icon;
                return (
                  <div
                    key={index}
                    className="bg-accent/10 p-6 rounded-2xl border border-gray-500 shadow-[0_0_10px_1.5px_#0066FF] transition"
                  >
                    <div className={`mb-4 ${service.color}`}>
                      <Icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-contrast mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        
      </div>
    </section>
  );
}
