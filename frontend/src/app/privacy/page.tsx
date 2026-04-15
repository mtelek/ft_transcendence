export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 px-6 py-12 flex justify-center">
      <div className="max-w-3xl space-y-6">

        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>

        <p>
          This Privacy Policy describes how <b>ft_transcendence</b> collects, uses,
          and protects your personal information when you use our application.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
          <p>
            We may collect the following information when you use our application:
          </p>
          <ul className="list-disc ml-6">
            <li>Username</li>
            <li>Email address</li>
            <li>Authentication data (e.g. via Google OAuth)</li>
            <li>Basic usage data (e.g. login activity)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
          <p>
            The collected data is used for the following purposes:
          </p>
          <ul className="list-disc ml-6">
            <li>To create and manage your account</li>
            <li>To authenticate users securely</li>
            <li>To provide and improve gameplay features</li>
            <li>To maintain application security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">3. Data Sharing</h2>
          <p>
            We do not sell, trade, or share your personal information with third parties.
            Data is only used internally for application functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">4. Data Storage</h2>
          <p>
            Your data is stored securely in a PostgreSQL database.
            We take reasonable measures to protect your data against unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">5. Authentication</h2>
          <p>
            We use secure authentication methods, including encrypted passwords and
            OAuth providers such as Google. Passwords are hashed and never stored in plain text.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal data.
            You may contact us or use the application settings to manage your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time.
            Continued use of the application means you accept these changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">8. Contact</h2>
          <p>
            If you have any questions about our Privacy Policy, please contact us
            through the application.
          </p>
        </section>

        <p className="text-sm text-gray-500 pt-6">
          Last updated: 15/04/2026
        </p>

      </div>
    </div>
  );
}