// components/Portfolio.tsx
"use client";

import { useRef } from 'react';
import ProjectCard from "./ProjectCard";
import { projects } from "../data/projects";
import { categories } from "../data/categories";
import { graphicDesigns } from "../data/graphicDesigns";
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Portfolio() {
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const graphicScrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (categoryName: string, direction: 'left' | 'right') => {
    const container = categoryName === 'graphic'
    ? graphicScrollRef.current
    : scrollRefs.current[categoryName];

    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="portfolio" className="py-5 bg-base font-sans">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-center text-4xl font-bold text-contrast border-b-2 border-accent pb-1 mb-4">Our Work</h2>
        <p className="text-center text-contrast max-w-xl mx-auto mb-12">
          Bold Websites. Beautiful Designs. Powerful Apps.
        </p>

        {categories?.map((category) => (
          <div key={category.name} className="mb-16">
            <h3 className="text-accent font-heading text-sm font-bold uppercase tracking-widest mb-2">{category.name}</h3>
            <h4 className="font-heading text-2xl font-bold text-contrast mb-6">{category.description}</h4>

            <div className="relative">
              <button
                onClick={() => scroll(category.name, 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-base/80 backdrop-blur-md border border-contrast text-contrast p-2 rounded-full hover:shadow-[0_0_10px_1.5px_#0066FF] transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div ref={(el) => {(scrollRefs.current[category.name] = el)}} className="overflow-x-auto no-scrollbar px-8 py-4">
                <div className="flex gap-4">
                  {projects.filter((project) => project.category === category.name).map((project) => (
                    <ProjectCard key={project.title} {...project} />
                  ))}
                </div>
              </div>

              <button
                onClick={() => scroll(category.name, 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-base/80 backdrop-blur-md border border-contrast text-contrast p-2 rounded-full hover:shadow-[0_0_10px_1.5px_#0066FF] transition"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>            
          </div>
        ))}

        {/* Graphic Design Showcase */}
        <div>
          <h3 className="text-accent font-heading text-sm font-bold uppercase tracking-widest mb-2">
            Graphic Design
          </h3>
          <h4 className="font-heading text-2xl font-bold text-contrast mb-6">
            Posters, Flyers, and Visual Assets
          </h4>

          <div className="relative">
            <button
              onClick={() => scroll('graphic', 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-base/80 backdrop-blur-md border border-contrast text-contrast p-2 rounded-full hover:shadow-[0_0_10px_1.5px_#0066FF] transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div ref={graphicScrollRef} className="overflow-x-auto whitespace-nowrap no-scrollbar px-8">
              <div className="flex gap-4">
                {graphicDesigns.map((item, idx) => (
                  <div
                    key={idx}
                    className="min-w-[240px] max-w-[240px] rounded-xl overflow-hidden border border-gray-700 shadow-lg"
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => scroll('graphic','right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-base/80 backdrop-blur-md border border-contrast text-contrast p-2 rounded-full hover:shadow-[0_0_10px_1.5px_#0066FF] transition"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>          

          <div className="text-center mt-6">
            <a
              href="/portfolio/graphic-design"
              className="inline-block bg-transparent border border-contrast text-contrast hover:shadow-[0_0_10px_1.5px_#0066FF] px-6 py-2 rounded-full transition"
            >
              See More Designs
            </a>
          </div>
        </div>        
      </div>
    </section>
  );
}
