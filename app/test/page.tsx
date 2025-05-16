"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useNotification } from "../notification-context";

export default function TestPage() {
  const { addNotification } = useNotification();
  const [showToggle, setShowToggle] = useState(false);

  const triggerNotification = (
    type: "success" | "error" | "warning" | "info"
  ) => {
    const messages = {
      success: {
        title: "Success Notification",
        message: "This is a success notification example.",
      },
      error: {
        title: "Error Notification",
        message: "This is an error notification example.",
      },
      warning: {
        title: "Warning Notification",
        message: "This is a warning notification example.",
      },
      info: {
        title: "Info Notification",
        message: "This is an info notification example.",
      },
    };

    addNotification({
      type,
      title: messages[type].title,
      message: messages[type].message,
      duration: 5000,
    });
  };

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Notification Test Page</h1>

        <div className="grid gap-4 max-w-md">
          <Button
            onClick={() => triggerNotification("success")}
            className="bg-green-500 hover:bg-green-600"
          >
            Show Success Notification
          </Button>

          <Button
            onClick={() => triggerNotification("error")}
            className="bg-red-500 hover:bg-red-600"
          >
            Show Error Notification
          </Button>

          <Button
            onClick={() => triggerNotification("warning")}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Show Warning Notification
          </Button>

          <Button
            onClick={() => triggerNotification("info")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Show Info Notification
          </Button>
        </div>

        <div className="mt-10">
          <p className="text-sm mb-4">
            You should also see a blue bell icon in the bottom-right corner of
            the screen. If not visible, click the button below to manually show
            the toggle.
          </p>
          <Button onClick={() => setShowToggle(true)}>Show Test Toggle</Button>
        </div>

        {showToggle && (
          <div className="fixed bottom-4 right-4 z-50">
            <button className="rounded-full w-12 h-12 bg-blue-500 text-white shadow-lg flex items-center justify-center">
              <span className="sr-only">Open test notifications</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
