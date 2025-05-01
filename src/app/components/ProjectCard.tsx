// components/ProjectCard.tsx
import Image from "next/image";

type Project = {
  title: string;
  description: string;
  image: string;
  link: string;
};

export default function ProjectCard({ title, description, image, link }: Project) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
      <Image
        src={image}
        alt={title}
        width={600}
        height={400}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 font-medium hover:underline"
        >
          View Project →
        </a>
      </div>
    </div>
  );
}
