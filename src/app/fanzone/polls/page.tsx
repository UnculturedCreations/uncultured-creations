import React from "react";

const cards = [
    {
        title: "Active Polls",
        value: 12,
        description: "Polls currently running",
    },
    {
        title: "Total Votes",
        value: 340,
        description: "Votes submitted so far",
    },
    {
        title: "Upcoming Polls",
        value: 3,
        description: "Polls scheduled to start soon",
    },
    {
        title: "Closed Polls",
        value: 8,
        description: "Polls that have ended",
    },
];

export default function PollsDashboard() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">Polls Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-white rounded-lg shadow p-6 flex flex-col items-start"
                    >
                        <div className="text-gray-500 text-sm mb-2">{card.title}</div>
                        <div className="text-3xl font-bold mb-1">{card.value}</div>
                        <div className="text-gray-400 text-xs">{card.description}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}