import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service | Frog Members",
  description: "Terms of Service for Frog Members. This document outlines the conditions for using our services.",
}

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500">Last Updated: {new Date().toISOString().split('T')[0]}</p>
      </div>

      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            These Terms of Service (hereinafter referred to as the "Terms") govern your use of the website (members.frogagent.com) and services (hereinafter referred to as the "Services") provided by Frog Creator Production Inc. (hereinafter referred to as "we," "us," "our," or "Frog").
            By using our Services, you agree to be bound by these Terms.
          </p>
          <p className="mt-2">
            If you do not agree to these Terms, please discontinue use of our Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            Our Services provide a platform for Japanese individuals seeking to study or work abroad, offering information, counseling, visa application support, and assistance with college selection.
            We reserve the right to modify, add, or discontinue any aspect of our Services without prior notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p>
            To access certain features of our Services, you may need to register for an account.
            When registering, you must provide accurate and current information.
          </p>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your account credentials (such as passwords) and
            for all activities that occur under your account.
            Please notify us immediately of any unauthorized use of your account or any other security breach.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Terms of Use</h2>
          <p>By using our Services, you agree to the following:</p>
          <ul className="list-disc pl-6">
            <li>Comply with these Terms and all applicable laws and regulations</li>
            <li>Respect the privacy of other users</li>
            <li>Not use our Services for any unlawful purpose</li>
            <li>Not interfere with the operation of our Services</li>
            <li>Not infringe upon the intellectual property rights of us or any third party</li>
            <li>Not provide false or misleading information</li>
            <li>Not transmit spam, malware, or other malicious content</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate the accounts of users who violate these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Fees and Payment</h2>
          <p>
            Basic features of our Services are available free of charge, but certain features or services may require payment.
            The fees and payment terms for such paid services will be clearly disclosed before you use them.
          </p>
          <p className="mt-2">
            Payments must be made through the methods specified by us.
            Fees include applicable taxes and are non-refundable (except as required by law).
          </p>
          <p className="mt-2">
            We reserve the right to change our fees. If we change our fees, we will provide notice in advance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cancellation and Refunds</h2>
          <p>
            Cancellation and refund policies for paid services are subject to the terms presented at the time of purchase.
            Unless otherwise specified, no refunds will be provided for cancellations after a service has commenced.
          </p>
          <p className="mt-2">
            If you experience issues with our Services, please contact our customer support.
            We will strive to provide appropriate solutions based on the circumstances.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property Rights</h2>
          <p>
            Our Services and their content (including text, graphics, logos, icons, images, audio clips, downloads, interfaces, code, etc.) are
            the intellectual property of us or our licensors and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p className="mt-2">
            You are granted a limited, non-exclusive, non-transferable license to use our Services for personal, non-commercial purposes.
            You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, sell, or commercially exploit the content of our Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. User Content</h2>
          <p>
            You retain ownership of any content you post, upload, or provide to our Services ("User Content").
            However, by posting User Content, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, modify, adapt, publish, translate,
            create derivative works from, distribute, and display such content.
          </p>
          <p className="mt-2">
            You are solely responsible for your User Content and represent and warrant that your User Content
            does not infringe upon the rights of any third party and does not violate any applicable laws.
          </p>
          <p className="mt-2">
            We reserve the right to remove User Content that is inappropriate, illegal, or violates these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Disclaimer</h2>
          <p>
            Our Services are provided "as is" without warranties of any kind, either express or implied.
            We do not warrant that our Services will be uninterrupted, error-free, or suitable for any particular purpose.
          </p>
          <p className="mt-2">
            We do not guarantee the accuracy, completeness, or usefulness of information provided through our Services.
            Information regarding educational institutions, visa requirements, and employment opportunities may change, and we recommend that you verify such information independently.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, we and our officers, employees, agents, and partners shall not be liable for
            any direct, indirect, incidental, special, consequential, or punitive damages arising from your use or inability to use our Services.
            This includes, but is not limited to, loss of profits, data, business interruption, and the like.
          </p>
          <p className="mt-2">
            In no event shall our total liability related to our Services exceed the amount you have paid to us (if any) or CAD $100, whichever is greater.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless us and our officers, employees, agents, and partners from and against
            any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from
            your violation of these Terms, violation of applicable laws, or infringement of third-party rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Third-Party Links and Services</h2>
          <p>
            Our Services may contain links to third-party websites, services, or content.
            We do not control and are not responsible for the content, privacy policies, or practices of any third-party websites, services, or content.
          </p>
          <p className="mt-2">
            You use third-party websites and services at your own risk.
            We recommend that you review the applicable terms and privacy policies before using any third-party website or service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time.
            If we make significant changes, we will notify you through website notifications, email communications, or other appropriate methods.
          </p>
          <p className="mt-2">
            Your continued use of our Services after such changes constitutes your acceptance of the modified Terms.
            If you do not agree to the modified Terms, please discontinue use of our Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Governing Law and Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Province of British Columbia, Canada.
            Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Vancouver, British Columbia.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">15. General Provisions</h2>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            Our failure to exercise or enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
          </p>
          <p className="mt-2">
            These Terms constitute the entire agreement between you and us regarding our Services and
            supersede all prior agreements, proposals, and communications regarding our Services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">16. Contact Us</h2>
          <p>
            If you have any questions or comments regarding these Terms, please contact us at:
          </p>
          <div className="mt-4">
            <p><strong>Frog Creator Production Inc.</strong></p>
            <p>Address: 717 West Pender Street, Vancouver, BC V6C 2X6, Canada</p>
            <p>Email: info@frogagent.com</p>
          </div>
        </section>
      </div>
    </div>
  )
} 