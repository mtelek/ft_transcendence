export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 px-6 py-12 flex justify-center">
      <div className="max-w-3xl space-y-6">

        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>

        <p>
          These Terms of Service govern your use of <b>ft_transcendence</b>.
          By accessing or using the application, you agree to these terms.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-white">1. Use of the Application</h2>
          <p>
            You agree to use this application only for lawful purposes.
            You must not misuse the platform or attempt to disrupt its functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account.
            Any activity under your account is your responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">3. Authentication</h2>
          <p>
            Users may register using credentials or third-party providers such as Google.
            You agree to provide accurate and complete information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">4. Acceptable Behavior</h2>
          <ul className="list-disc ml-6">
            <li>No cheating or exploiting game mechanics</li>
            <li>No harassment or abusive behavior</li>
            <li>No attempts to access unauthorized data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
          <p>
            All content, design, and functionality of this application belong to
            the project creators unless otherwise stated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms or misuse the application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
          <p>
            This application is provided "as is" without warranties.
            We are not responsible for any damages or data loss resulting from its use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">8. Changes to Terms</h2>
          <p>
            These terms may be updated at any time.
            Continued use of the application means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">9. Contact</h2>
          <p>
            For questions regarding these Terms of Service, please contact us
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