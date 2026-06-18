import React from "react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last Updated: June 2026</p>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Introduction</h2>
          <p className="mt-2 text-gray-300">
            Welcome to our platform. We respect your privacy and are committed
            to protecting your personal information. This Privacy Policy
            explains how we collect, use, store, and protect your data when you
            use our services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Information We Collect</h2>

          <h3 className="mt-3 font-semibold">Account Information</h3>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Name</li>
            <li>Email address</li>
            <li>Username</li>
            <li>Password</li>
          </ul>

          <h3 className="mt-3 font-semibold">Project Data</h3>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Source code files</li>
            <li>Folder structures</li>
            <li>Project settings</li>
            <li>AI-generated code suggestions</li>
          </ul>

          <h3 className="mt-3 font-semibold">Usage Information</h3>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Login activity</li>
            <li>Device information</li>
            <li>Browser information</li>
            <li>IP address</li>
            <li>Error logs and analytics</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">How We Use Your Information</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Create and manage your account</li>
            <li>Store and synchronize projects</li>
            <li>Provide AI-powered coding assistance</li>
            <li>Improve platform performance</li>
            <li>Detect abuse and security threats</li>
            <li>Respond to support requests</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Data Storage</h2>
          <p className="mt-2 text-gray-300">
            Your projects and account information are stored on secure servers.
            We take reasonable measures to protect your data against
            unauthorized access, modification, or disclosure.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Cookies</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Keep users signed in</li>
            <li>Remember preferences</li>
            <li>Improve user experience</li>
            <li>Analyze platform usage</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Third-Party Services</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Authentication</li>
            <li>Cloud hosting</li>
            <li>Analytics</li>
            <li>AI services</li>
          </ul>
          <p className="mt-2 text-gray-300">
            These providers may process information according to their own
            privacy policies.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">User Rights</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-300">
            <li>Access your information</li>
            <li>Update account details</li>
            <li>Request removal of your data</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Data Retention</h2>
          <p className="mt-2 text-gray-300">
            We retain data as long as necessary to provide our services or
            comply with legal obligations.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="mt-2 text-gray-300">
            While we implement security measures, no online service can
            guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Changes to This Policy</h2>
          <p className="mt-2 text-gray-300">
            We may update this Privacy Policy from time to time. Continued use
            of the platform indicates acceptance of any updates.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-gray-300">
            For privacy-related questions, contact us through the platform
            support page.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
