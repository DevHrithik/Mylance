"use client";

import { useEffect, useState } from "react";

export function DashboardHeader() {
  const [greeting, setGreeting] = useState("");

  // Generate greeting based on time of day
  useEffect(() => {
    const generateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        return "Good morning";
      } else if (hour < 17) {
        return "Good afternoon";
      } else {
        return "Good evening";
      }
    };

    setGreeting(generateGreeting());
  }, []);

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">{greeting}! 👋</h1>
      <p className="text-gray-600 mt-1">
        Ready to create engaging LinkedIn content that converts?
      </p>
    </div>
  );
}
