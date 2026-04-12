import React from 'react';

/* eslint-disable react/no-unescaped-entities */

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-6 text-sm">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to ReplySystem (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="mb-4">We may collect information about you in a variety of ways:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, company details, and other contact information you provide during registration.</li>
              <li><strong>WhatsApp Business Data:</strong> Messages, conversations, templates, and media exchanged through the WhatsApp Business platform.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including login times, feature usage, and device information.</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through third-party providers).</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar tracking technologies to enhance your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your requests and transactions</li>
              <li>Send administrative information and service updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze trends, usage, and activities for analytics</li>
              <li>Prevent fraudulent transactions and enhance security</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="mb-4">
              We implement comprehensive security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Our security measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>SSL/TLS encryption for data in transit</li>
              <li>Secure database encryption for data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure password hashing and storage</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the Internet is 100&percnt; secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell your personal information. We may share your information:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>With Meta/Facebook for WhatsApp Business integration and API services</li>
              <li>With service providers and vendors who assist us in operating our platform</li>
              <li>When required by law or in response to legal requests</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with mergers, acquisitions, or asset sales</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Access your personal information</li>
              <li>Correct or update inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Port your data to another service</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Links</h2>
            <p className="mb-4">
              Our platform may contain links to third-party websites. We are not responsible for the privacy practices of external sites. Please review their privacy policies before sharing any information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by prominently posting a notice on our website. Your continued use of our services after changes indicates your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded">
              <p className="font-semibold">ReplySystem</p>
              <p>Email: privacy@replysys.com</p>
              <p>Website: https://replysys.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
