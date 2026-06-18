import React from "react";

const Docs = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Platform Documentation</h1>
      <p className="text-sm text-gray-400 mb-8">
        Learn how to use the platform effectively
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Getting Started</h2>

          <h3 className="mt-3 font-semibold">Create an Account</h3>
          <ol className="list-decimal ml-6 text-gray-300">
            <li>Click Sign Up</li>
            <li>Authenticate using Email</li>
            <li>Complete your profile</li>
          </ol>

          <h3 className="mt-4 font-semibold">Create a Project</h3>
          <ol className="list-decimal ml-6 text-gray-300">
            <li>Open Dashboard</li>
            <li>Click New Project</li>
            <li>Enter project name</li>
            <li>Give password and start from scratch</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-semibold">File Explorer</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Create files via File or +F</li>
            <li>Create folders via Folder or +D</li>
            <li>Rename items via R</li>
            <li>Delete unwanted files/folders via D</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Code Editor Features</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Syntax highlighting</li>
            <li>Auto-completion</li>
            <li>Inline AI suggestions</li>
            <li>Error highlighting</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">AI Code Assistance</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Code completion</li>
            <li>Function generation</li>
            <li>Code explanation</li>
            <li>Refactoring support</li>
            <li>Error fixing</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Running Projects</h2>
          <ol className="list-decimal ml-6 mt-2 text-gray-300">
            <li>Open your project</li>
            <li>Click Run</li>
            <li>View output in terminal or preview</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Security Guidelines</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Review AI-generated code before execution</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">FAQ</h2>

          <h3 className="mt-3 font-semibold">Is my code private?</h3>
          <p className="text-gray-300">Yes, access is restricted to you.</p>

          <h3 className="mt-3 font-semibold">Can I delete projects?</h3>
          <p className="text-gray-300">Yes, from dashboard settings.</p>

          <h3 className="mt-3 font-semibold">Can AI generate wrong code?</h3>
          <p className="text-gray-300">
            Yes, always review and test before production use.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Support</h2>
          <p className="mt-2 text-gray-300">
            Contact support through the help section for issues or feature
            requests.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Docs;
