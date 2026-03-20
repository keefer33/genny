import { Container, Divider, Stack, Text, Title } from "@mantine/core";

export default function PrivacyPolicy() {
  return (
    <Container size="md" py={40}>
      <Stack gap="lg">
        <div>
          <Title order={1} mb="xs">
            Privacy Policy
          </Title>
          <Text c="dimmed" size="sm">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </div>

        <section>
          <Title order={3} mb="sm">
            1. Introduction
          </Title>
          <Text size="sm">
            Genny (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Genny.bot web
            application and related services (collectively, the &quot;Service&quot;). This Privacy
            Policy explains how we collect, use, disclose, and safeguard information when you use
            the Service. By using the Service, you agree to the collection and use of information in
            accordance with this policy.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            2. Information We Collect
          </Title>
          <Text size="sm" mb="xs">
            <strong>Account and profile information.</strong> When you register or sign in, we may
            collect your name, email address, authentication identifiers (e.g., from providers such
            as Google), and profile preferences you choose to provide.
          </Text>
          <Text size="sm" mb="xs">
            <strong>Usage and technical data.</strong> We may collect information about how you
            access and use the Service, including IP address, browser type, device identifiers,
            pages viewed, features used, timestamps, and diagnostic or performance data.
          </Text>
          <Text size="sm" mb="xs">
            <strong>Content you provide.</strong> We process prompts, files, generations, and other
            content you submit through the Service as needed to provide features you request.
          </Text>
          <Text size="sm">
            <strong>Payment information.</strong> If you make purchases, payment processing is
            handled by third-party payment processors. We do not store full payment card numbers on
            our servers; we may receive limited transaction metadata (e.g., last four digits,
            subscription status) as permitted by the processor.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            3. How We Use Your Information
          </Title>
          <Text size="sm" mb="xs">
            We use the information we collect to: provide, maintain, and improve the Service;
            authenticate users; process transactions and send related communications; respond to
            support requests; analyze usage to improve performance and security; detect, prevent,
            and address fraud, abuse, or technical issues; comply with legal obligations; and
            communicate with you about updates, policies, or marketing where permitted by law and
            your preferences.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            4. Legal Bases (Where Applicable)
          </Title>
          <Text size="sm">
            If you are in the European Economic Area, United Kingdom, or similar regions, we may
            rely on one or more legal bases: performance of a contract, legitimate interests (e.g.,
            security and service improvement), consent where required, and compliance with legal
            obligations.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            5. Sharing and Disclosure
          </Title>
          <Text size="sm" mb="xs">
            We may share information with: service providers who assist us (hosting, analytics,
            authentication, payment processing, customer support) subject to confidentiality
            obligations; professional advisors where required; and law enforcement or other parties
            when we believe disclosure is necessary to comply with law, protect rights, safety, or
            security, or enforce our Terms.
          </Text>
          <Text size="sm">
            We do not sell your personal information as commonly defined in applicable privacy laws.
            We may share aggregated or de-identified information that cannot reasonably identify
            you.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            6. Cookies and Similar Technologies
          </Title>
          <Text size="sm">
            We and our partners may use cookies, local storage, and similar technologies for
            authentication, preferences, security, and analytics. You can control cookies through
            your browser settings; disabling some cookies may limit certain features.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            7. Data Retention
          </Title>
          <Text size="sm">
            We retain information for as long as your account is active or as needed to provide the
            Service, comply with legal obligations, resolve disputes, and enforce our agreements.
            Retention periods may vary by data type and business need.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            8. Security
          </Title>
          <Text size="sm">
            We implement reasonable technical and organizational measures designed to protect
            personal information. No method of transmission or storage is 100% secure; we cannot
            guarantee absolute security.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            9. International Transfers
          </Title>
          <Text size="sm">
            If you access the Service from outside the country where our servers or providers are
            located, your information may be transferred to and processed in countries that may have
            different data protection laws. Where required, we use appropriate safeguards (e.g.,
            standard contractual clauses).
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            10. Your Rights and Choices
          </Title>
          <Text size="sm" mb="xs">
            Depending on your location, you may have rights to access, correct, delete, or export
            your personal information; object to or restrict certain processing; withdraw consent
            where processing is consent-based; and lodge a complaint with a supervisory authority.
          </Text>
          <Text size="sm">
            To exercise rights or ask questions, contact us using the information in the Contact
            section below. We may need to verify your identity before fulfilling requests.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            11. Children&apos;s Privacy
          </Title>
          <Text size="sm">
            The Service is not directed to children under 13 (or the age required in your
            jurisdiction). We do not knowingly collect personal information from children. If you
            believe we have collected such information, please contact us and we will take steps to
            delete it.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            12. Third-Party Services
          </Title>
          <Text size="sm">
            The Service may link to or integrate third-party websites or services. We are not
            responsible for their privacy practices. We encourage you to read their privacy
            policies.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            13. Changes to This Privacy Policy
          </Title>
          <Text size="sm">
            We may update this Privacy Policy from time to time. We will post the revised policy on
            this page and update the &quot;Last updated&quot; date. Continued use of the Service
            after changes constitutes acceptance of the updated policy, where permitted by law.
            Material changes may require additional notice.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            14. Contact Us
          </Title>
          <Text size="sm">
            For privacy-related questions or requests, contact us through the in-app support page or
            at the contact method we provide on our website. Replace this placeholder with your
            official privacy contact email.
          </Text>
        </section>
      </Stack>
    </Container>
  );
}
