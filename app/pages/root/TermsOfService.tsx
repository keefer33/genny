import { Container, Divider, Stack, Text, Title } from "@mantine/core";

export default function TermsOfService() {
  return (
    <Container size="md" py={40}>
      <Stack gap="lg">
        <div>
          <Title order={1} mb="xs">
            Terms of Service
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
            1. Agreement to Terms
          </Title>
          <Text size="sm">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of Genny.bot
            and related services (the &quot;Service&quot;) operated by Genny (&quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service, you agree to be
            bound by these Terms and our Privacy Policy. If you do not agree, do not use the
            Service.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            2. Eligibility and Accounts
          </Title>
          <Text size="sm" mb="xs">
            You must be at least the age of majority in your jurisdiction (or 13 or older with
            parental consent where required) to use the Service. You agree to provide accurate
            registration information and to keep your account credentials secure. You are
            responsible for all activity under your account.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            3. Description of Service
          </Title>
          <Text size="sm">
            The Service provides tools for AI-assisted content generation, agents, integrations, and
            related features as described on our website or in-product. We may modify, suspend, or
            discontinue features with or without notice. We do not guarantee uninterrupted or
            error-free operation.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            4. Acceptable Use
          </Title>
          <Text size="sm" mb="xs">
            You agree not to: use the Service to violate any law or third-party rights; generate or
            distribute illegal, harmful, fraudulent, defamatory, harassing, or infringing content;
            attempt to gain unauthorized access to systems, data, or accounts; interfere with or
            disrupt the Service; scrape, crawl, or automate access in violation of our terms or
            technical limits; reverse engineer except where permitted by law; resell or sublicense
            the Service without authorization; or use the Service to build competing products in
            violation of our policies.
          </Text>
          <Text size="sm">
            We may investigate violations and suspend or terminate accounts that we reasonably
            believe breach these Terms.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            5. User Content and Intellectual Property
          </Title>
          <Text size="sm" mb="xs">
            You retain ownership of content you submit (&quot;User Content&quot;), subject to the
            rights you grant us below. You grant us a worldwide, non-exclusive license to use, host,
            store, reproduce, modify, and display User Content solely to operate, improve, and
            provide the Service to you, and as described in our Privacy Policy.
          </Text>
          <Text size="sm" mb="xs">
            Output generated through the Service may be subject to third-party terms (e.g., model
            providers). You are responsible for determining whether output is suitable for your use
            and for complying with applicable laws and licenses.
          </Text>
          <Text size="sm">
            The Service, including its software, branding, and documentation, is owned by us or our
            licensors and is protected by intellectual property laws. Except as expressly permitted,
            you may not copy, modify, or create derivative works without our written consent.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            6. Fees, Credits, and Payment
          </Title>
          <Text size="sm">
            Certain features may require payment, credits, or subscriptions. Fees, billing cycles,
            and refund policies will be presented at purchase or in your account. You authorize us
            and our payment processors to charge applicable payment methods. Taxes may apply where
            required. We may change pricing with reasonable notice where required by law.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            7. Third-Party Services
          </Title>
          <Text size="sm">
            The Service may integrate third-party tools, APIs, or content. Your use of those
            services may be subject to separate terms. We are not responsible for third-party
            products or services.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            8. Disclaimers
          </Title>
          <Text size="sm">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT
            WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. AI-generated outputs may be inaccurate
            or incomplete; you are solely responsible for your reliance on the Service and any
            decisions you make based on it.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            9. Limitation of Liability
          </Title>
          <Text size="sm">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES, OFFICERS, DIRECTORS,
            EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR TOTAL
            LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL
            NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12)
            MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100), EXCEPT WHERE PROHIBITED
            BY LAW.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            10. Indemnification
          </Title>
          <Text size="sm">
            You will defend, indemnify, and hold harmless Genny and its affiliates from and against
            any claims, damages, losses, and expenses (including reasonable attorneys&apos; fees)
            arising out of your User Content, your use of the Service, or your violation of these
            Terms or applicable law.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            11. Termination
          </Title>
          <Text size="sm">
            You may stop using the Service at any time. We may suspend or terminate your access if
            you breach these Terms, if we are required to do so by law, or for other operational
            reasons with notice where practicable. Provisions that by their nature should survive
            (e.g., disclaimers, limitations, indemnity) will survive termination.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            12. Governing Law and Disputes
          </Title>
          <Text size="sm">
            These Terms are governed by the laws of [Your State/Country], excluding conflict-of-law
            rules. Disputes shall be resolved in the courts of [Your Jurisdiction], unless
            applicable law requires otherwise or you have mandatory consumer rights in your country.
            Replace bracketed text with your chosen governing law and venue. Some jurisdictions
            require specific dispute resolution (e.g., arbitration); consult counsel.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            13. Changes to These Terms
          </Title>
          <Text size="sm">
            We may update these Terms from time to time. We will post the updated Terms on this page
            and update the &quot;Last updated&quot; date. Continued use after the effective date
            constitutes acceptance of the revised Terms where permitted by law. If you do not agree,
            you must stop using the Service.
          </Text>
        </section>

        <Divider />

        <section>
          <Title order={3} mb="sm">
            14. Contact
          </Title>
          <Text size="sm">
            For questions about these Terms, contact us through the in-app support page or at the
            contact method we provide on our website. Replace this with your official legal or
            support contact.
          </Text>
        </section>
      </Stack>
    </Container>
  );
}
