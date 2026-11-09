import type { Metadata } from "next"
import { CONTACT_EMAIL, pageMetadata } from "@/app/data/site"

const description = "What personal data Uncultured Creations collects, why, where it is kept and how to have it deleted."

export const metadata: Metadata = pageMetadata("Privacy notice", description, "/privacy")

const LAST_UPDATED = "6 November 2026"  // update when this notice changes

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="font-heading text-xl font-bold text-contrast sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  )
}

// Describes how this site works today. Review it whenever a feature that handles personal data changes.
export default function Privacy() {
  const contact = CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-contrast underline underline-offset-4">
      {CONTACT_EMAIL}
    </a>
  ) : (
    "the contact address shown on this site"
  )

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="font-heading text-4xl font-bold text-contrast sm:text-5xl">Privacy notice</h1>
      <p className="mt-3 text-sm text-contrast/60">Last updated {LAST_UPDATED}</p>
      <p className="mt-6 text-lg leading-relaxed text-contrast/85">
        This notice explains what personal data Uncultured Creations collects through this website, why, and what you can ask us to do
        with it. We collect as little as we can, we never sell personal data, and this site has no advertising or analytics tracking.
      </p>

      <div className="mt-10 space-y-10 leading-relaxed text-contrast/85">
        <Section id="accounts" title="Fan accounts">
          <p>
            You can create a fan account by signing in with an account you already have, such as Google. We receive your name, email address
            and an account identifier from that service; we never see your password and never post anything on your behalf. We also keep the
            fan name you choose and the date you confirmed you&apos;re 18 or older. Fan accounts are for people aged 18 or older.
          </p>
          <p>
            If you play predictions, we keep your picks with your account to calculate points. Other fans never see your individual picks, only
            totals once picks close; leaderboards show your fan name, points and number of correct picks. Deleting your account deletes your picks.
          </p>
          <p>
            If you submit fan fiction while signed in, your stories and chapters are linked to your account so you can follow their review and
            add chapters. Only the site admin and editors can see which account wrote a story; readers see your pen name. If you delete your
            account, your unpublished stories are deleted and your published ones stay on the site under your pen name, no longer linked to you.
            Ask us if you&apos;d like them removed too.
          </p>
          <p>
            If you comment on stories, your comments are shown publicly with your fan name. You can delete your own comments at any time. If
            other fans report a comment, our editors review it and may remove it or turn off commenting for an account.
          </p>
          <p>
            Your fan name is shown publicly, for example on leaderboards. Your email is never shown to other fans. We keep your account until
            you delete it, which you can do at any time on your account page; deleting it removes your account and fan name permanently.
          </p>
        </Section>

        <Section id="yard" title="The Yard early-access sign-up">
          <p>
            If you sign up for early access to The Yard, we keep your email address, whether you run a fanbase or are a fan, and anything else
            you choose to tell us: a name or nickname, the show, your fanbase&apos;s name and size, and how you organise votes today.
          </p>
          <p>
            We use these details only to contact you about The Yard and to plan who to invite first. Signing up is your choice, and we rely on
            your consent. You can withdraw it at any time by asking us to delete your details. Sign-up is for people aged 18 or older.
          </p>
          <p>We keep sign-ups until The Yard&apos;s early access ends, then delete them, or sooner if you ask.</p>
        </Section>

        <Section id="fan-fiction" title="Fan fiction">
          <p>
            If you submit a story, we keep your story, its title, your pen name and, only if you give it, your email address. Editors read every
            submission, and approved stories are published under your pen name. Your email is never published or shown to our editors; only the
            site admin can see it, to contact you about your story.
          </p>
          <p>
            If you upload a cover image, we keep that too; it&apos;s published only if your story is approved. Readers can react to stories:
            like poll votes, reactions are stored against a scrambled code from your browser, never your name or email.
          </p>
          <p>
            You keep the rights to your story. We keep it while it&apos;s published or waiting for review, and delete declined stories when we
            tidy up. Ask us at any time to remove your story or your email. Submissions are for people aged 18 or older.
          </p>
        </Section>

        <Section id="polls" title="Polls">
          <p>
            To allow one vote per device, your browser stores a random code. When you vote, we store only a scrambled (hashed) version of that
            code with your vote. It is not linked to your name, email or account, and we cannot use it to identify you. Votes are deleted along
            with their poll. Your browser also remembers which polls you voted in; clearing your browser data removes this.
          </p>
        </Section>

        <Section id="bot-checks" title="Bot checks">
          <p>
            Poll votes, sign-ups and story submissions are protected by Cloudflare Turnstile, which checks that you&apos;re a person rather than an automated
            program. To do this, Cloudflare processes technical information such as your IP address and browser details, under Cloudflare&apos;s
            own privacy policy.
          </p>
        </Section>

        <Section id="services" title="Where data is kept">
          <p>
            Sign-ups, fan fiction, polls and site content are stored with Supabase, on servers in Ireland in the European Union. The website is hosted by
            Vercel, which processes technical information such as IP addresses to deliver pages and keep the site secure. These providers act
            on our behalf. Because they are outside Nigeria and South Africa, your data is transferred abroad when you use these features.
          </p>
        </Section>

        <Section id="editors" title="Editor accounts">
          <p>
            Our editors sign in with an email address and password, stored by Supabase. Visitors don&apos;t need an account to use this site.
          </p>
        </Section>

        <Section id="rights" title="Your rights">
          <p>
            You can ask to see the personal data we hold about you, to correct it, or to delete it. Email {contact} and we&apos;ll respond as
            soon as we can.
          </p>
          <p>
            If you&apos;re unhappy with how we handle your data, you can complain to the Nigeria Data Protection Commission if you&apos;re in
            Nigeria, or the Information Regulator if you&apos;re in South Africa.
          </p>
        </Section>

        <Section id="changes" title="Changes to this notice">
          <p>When we add features that use personal data, we&apos;ll update this notice and the date at the top.</p>
        </Section>
      </div>
    </main>
  )
}
