import React from 'react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 mb-8">
            We'd love to hear from you! Whether you have questions about our platform, need support, or want to discuss a partnership, feel free to reach out.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get In Touch</h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📧 Email</h3>
                <p className="text-gray-600 mb-1">
                  <strong>General Inquiries:</strong> info@replysys.com
                </p>
                <p className="text-gray-600 mb-1">
                  <strong>Support:</strong> support@replysys.com
                </p>
                <p className="text-gray-600">
                  <strong>Privacy & Legal:</strong> privacy@replysys.com
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🌐 Website</h3>
                <p className="text-gray-600">
                  <a href="https://replysys.com" className="text-blue-600 hover:text-blue-800">
                    https://replysys.com
                  </a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">💼 Business Address</h3>
                <p className="text-gray-600">
                  ReplySystem<br />
                  India
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">⏰ Response Time</h3>
                <p className="text-gray-600">
                  We aim to respond to all inquiries within 24 business hours.
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">FAQ</h2>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I create an account?</h3>
                <p className="text-gray-600">
                  Visit our platform and click "Sign Up". Fill in your details and follow the verification process to get started.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a trial period?</h3>
                <p className="text-gray-600">
                  Yes, we offer a trial period for new users. Contact our sales team for more details on trial eligibility.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">
                  We accept credit cards, debit cards, and other digital payment methods through our secure payment gateway.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer API access?</h3>
                <p className="text-gray-600">
                  Yes, we provide comprehensive API documentation for developers. Contact support@replysys.com for API access.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="support">Support Request</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="partnership">Partnership</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your message..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                Send Message
              </button>
            </form>
            <p className="text-gray-600 text-sm mt-4">
              * Required fields. We'll get back to you as soon as possible.
            </p>
          </div>
        </div>

        {/* Support Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
            <p className="text-gray-600 text-sm mb-4">
              Check our comprehensive guides and documentation
            </p>
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              View Docs →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">🎓</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tutorials</h3>
            <p className="text-gray-600 text-sm mb-4">
              Learn from our step-by-step video tutorials
            </p>
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              View Tutorials →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600 text-sm mb-4">
              Join our community for tips and best practices
            </p>
            <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
              Join Community →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
