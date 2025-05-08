import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | Frog Members",
  description: "Privacy Policy for Frog Members. This document explains how we handle your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500">Last Updated: {new Date().toISOString().split('T')[0]}</p>
      </div>

      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Frog Creator Production Inc. (hereinafter referred to as "we," "us," "our," or "Frog") respects your privacy and is committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website (members.frogagent.com) and services (hereinafter referred to as the "Services").
          </p>
          <p>
            We comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) of Canada and other applicable privacy laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <h3 className="text-xl font-medium mt-4 mb-2">2.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Contact information such as name, email address, and phone number</li>
            <li>Account information such as username and password</li>
            <li>Profile information such as occupation, education, and language proficiency</li>
            <li>Study abroad related information such as travel purpose, desired destination, and future career goals</li>
            <li>Payment-related information (such as billing address and payment history. Note that credit card information is not stored by us but is processed directly by our payment service provider, Stripe)</li>
            <li>Content of inquiries and support requests</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Technical information such as IP address, device information, and browser type</li>
            <li>Information collected through cookies, pixel tags, and other technologies</li>
            <li>Usage data and browsing history</li>
            <li>Location information (if permitted by you)</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">2.3 Information from Third Parties</h3>
          <ul className="list-disc pl-6">
            <li>Information from social media platforms (such as Google, Facebook, Twitter) if you log in through these services</li>
            <li>Information from partner companies and related services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-6">
            <li>To provide, maintain, and improve our Services</li>
            <li>To create and manage your account</li>
            <li>To provide customer support</li>
            <li>To suggest content and services tailored to your needs</li>
            <li>To communicate with you (such as service updates and security notifications)</li>
            <li>For marketing and promotional activities (with your consent)</li>
            <li>To detect and prevent fraudulent activities</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
          <p>We may share your personal information with third parties in the following circumstances:</p>
          <ul className="list-disc pl-6">
            <li>With your consent</li>
            <li>When necessary for providing our Services (such as partner educational institutions, visa support services)</li>
            <li>With third-party service providers that support our operations (such as hosting, payment processing, customer support)</li>
            <li>When required to comply with legal requirements (such as court orders, legal proceedings, government requests)</li>
            <li>When necessary to protect our rights, property, or safety</li>
            <li>In connection with corporate transactions such as business transfers, mergers, or acquisitions</li>
          </ul>
          <p className="mt-4">
            We do not sell your personal information. When sharing with third parties, we ensure that appropriate data protection measures are in place.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-2">4.1 Handling of Payment Information</h3>
          <p>
            We use Stripe, a payment service provider, to process your payments. 
            Payment information such as credit card details is not stored on our servers but is processed and stored directly by Stripe.
            Stripe maintains your payment information in a secure environment that complies with the Payment Card Industry Data Security Standard (PCI DSS).
          </p>
          <p className="mt-2">
            The information we receive from Stripe is limited to payment processing results (success or failure) and minimal information to identify you (such as transaction ID and payment method type).
            For more information about Stripe's privacy practices, please refer to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's Privacy Policy</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Storage and International Transfers</h2>
          <p>
            While we are based in Canada, our servers and service providers may be located in various parts of the world.
            As a result, your personal information may be transferred, processed, and stored outside of Canada.
            We comply with applicable laws regarding international data transfers and take appropriate measures to protect your information.
          </p>
          <p className="mt-2">
            We retain your personal information for as long as necessary to provide our Services or to comply with legal obligations.
            When personal information is no longer needed, it will be securely deleted or anonymized.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p>Under Canadian privacy law, you have the following rights:</p>
          <ul className="list-disc pl-6">
            <li>Right to access your personal information</li>
            <li>Right to correct your personal information</li>
            <li>Right to delete your personal information (except where we are required to retain it by law)</li>
            <li>Right to object to the processing of your personal information</li>
            <li>Right to data portability</li>
            <li>Right to withdraw consent for the use of your personal information for marketing purposes</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            We will respond to your request in a timely manner in accordance with applicable law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
          <p>
            We implement appropriate technical, organizational, and physical security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
            However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
          <p className="mt-2">
            For the security of your payment information, we ensure high security standards by using a PCI DSS-compliant payment service provider (Stripe).
            Credit card information is not stored on our servers but is securely processed by specialized payment service providers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
          <p>
            Our website uses tracking technologies such as cookies and pixel tags.
            These technologies are used to enhance website functionality, analyze usage, and provide personalized content.
          </p>
          <p className="mt-2">
            Most web browsers allow you to limit or disable the use of cookies.
            However, disabling cookies may cause some features of our website to not function properly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p>
            Our Services are not directed to children under 16 years of age.
            If we inadvertently collect personal information from children under 16, we will take measures to delete such information.
            If you believe that we have personal information from a child under 16, please contact us using the information provided in the "Contact Us" section below.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Third-Party Links</h2>
          <p>
            Our website and Services may contain links to third-party websites.
            We are not responsible for the privacy practices or content of these third-party websites.
            We recommend that you review the privacy policies of any website you visit before providing any personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time.
            If we make significant changes, we will notify you through website notifications, email communications, or other appropriate methods.
            We recommend that you review the Privacy Policy regularly.
          </p>
          <p className="mt-2">
            The date of the last update to this Privacy Policy is indicated at the top of this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p>
            If you have any questions, comments, or requests regarding this Privacy Policy or the exercise of your rights, please contact us at:
          </p>
          <div className="mt-4">
            <p><strong>Frog Creator Production Inc.</strong></p>
            <p>Address: 717 West Pender Street, Vancouver, BC V6C 2X6, Canada</p>
            <p>Email: info@frogagent.com</p>
          </div>
          <p className="mt-4">
            We are committed to addressing your concerns about privacy in a timely and appropriate manner.
            If you are not satisfied with our response, you have the right to file a complaint with the Office of the Privacy Commissioner of Canada.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Consent</h2>
          <p>
            By using our website and Services, you are deemed to have consented to this Privacy Policy.
            If you do not agree with this Policy, please discontinue use of our Services.
          </p>
        </section>
      </div>
    </div>
  )
} 