import React from "react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
          <p className="mt-2 text-gray-300">
            By accessing or using this platform, you agree to comply with these
            Terms of Service.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">User Accounts</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Maintaining account security</li>
            <li>Protecting passwords</li>
            <li>All activity under your account</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Acceptable Use</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Upload malicious software</li>
            <li>Distribute malware or viruses</li>
            <li>Attempt unauthorized access</li>
            <li>Abuse system resources</li>
            <li>Engage in illegal activities</li>
            <li>Harass or harm other users</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">User Content</h2>
          <p className="mt-2 text-gray-300">
            You retain ownership of the code and content you create. By using
            the platform, you grant us permission to store and process your
            content solely to provide our services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">AI Features</h2>
          <p className="mt-2 text-gray-300">
            AI-generated code suggestions are provided for convenience. Users
            must review, test, and validate generated code before deployment.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Service Availability</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Maintenance periods</li>
            <li>Possible outages</li>
            <li>Feature changes without notice</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Account Suspension</h2>
          <p className="mt-2 text-gray-300">
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Intellectual Property</h2>
          <p className="mt-2 text-gray-300">
            All platform design, branding, and software remain the property of
            the platform owners.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Data loss</li>
            <li>Service interruptions</li>
            <li>Financial losses</li>
            <li>Project failures</li>
            <li>Security incidents beyond control</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Changes to Terms</h2>
          <p className="mt-2 text-gray-300">
            We may update these Terms at any time. Continued use indicates
            acceptance of updated terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Governing Law</h2>
          <p className="mt-2 text-gray-300">
            These terms shall be governed by applicable laws in the relevant
            jurisdiction.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Terms;
