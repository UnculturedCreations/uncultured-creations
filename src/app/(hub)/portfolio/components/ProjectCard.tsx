'use client';

import { useState } from "react";
import Image from "next/image";

type Project = {
  title: string;
  description: string;
  image: string;
  link: string;
};

export default function ProjectCard({ title, description, image, link }: Project) {
  const [expanded, setExpanded] = useState(false);

  const toggleDescription = () => setExpanded(!expanded);

  const maxChars = 37;
  const isLong = description.length > maxChars;
  const preview = isLong ? description.slice(0, maxChars) + "..." : description;

  return (
    <div className="w-[280px] bg-contrast rounded-2xl overflow-hidden hover:shadow-[0_0_10px_1.5px_#0066FF] transition flex-shrink-0 flex flex-col">
      <Image
        src={image}
        alt={title}
        width={600}
        height={400}
        className="w-full h-48 object-cover"
      />
      <div className="p-4 flex flex-col h-full">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>

        <p className="text-gray-600 text-sm mb-2 brea-words">
          {expanded || !isLong ? description : preview}
        </p>

        {isLong && (
          <button
            onClick={toggleDescription}
            className="text-accent text-sm font-medium hover:underline mb-2"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent font-medium hover:underline"
        >
          View Project →
        </a>
      </div>
    </div>
  );
}
