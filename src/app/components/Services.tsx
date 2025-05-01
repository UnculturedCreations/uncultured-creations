'use client';

import { services } from '../data/services';

export default function Services() {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">
          Our Services
        </h2>
        <p className="text-center text-gray-600 max-w-xl mx-auto mb-12">
          Full-service creative solutions tailored to your needs — from design to development.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition"
              >
                <div className={`mb-4 ${service.color}`}>
                  <Icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
