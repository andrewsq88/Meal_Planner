import { Moon, Sun, UtensilsCrossed } from 'lucide-react';
import {
  LEGAL_UPDATED,
  OPERATOR_CONTACT,
  OPERATOR_NAME,
  PRODUCT_NAME,
  SITE_HOST,
  SITE_URL,
  type LegalPageSpec,
} from '../content/legal';
import { setAdConsent } from '../lib/consent';
import { SiteFooter } from './SiteFooter';

interface LegalPageProps {
  page: LegalPageSpec;
  pathname: string;
  dark: boolean;
  onToggleDark: () => void;
}

function Shell({
  page,
  pathname,
  dark,
  onToggleDark,
  children,
}: LegalPageProps & { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900">
      <header className="border-b border-amber-100 dark:border-stone-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a href="/" className="inline-flex items-center gap-2 text-stone-800 dark:text-stone-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">{PRODUCT_NAME}</span>
          </a>
          <button
            type="button"
            onClick={onToggleDark}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-stone-600 hover:bg-amber-50 dark:text-stone-300 dark:hover:bg-stone-800"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 text-stone-700 dark:text-stone-300">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100">
          {page.heading}
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Last updated {LEGAL_UPDATED}</p>
        <div className="legal-body mt-8 space-y-4 text-base leading-relaxed">{children}</div>
      </main>
      <SiteFooter
        pathname={pathname}
        className="border-t border-amber-100 dark:border-stone-700 py-5"
      />
    </div>
  );
}

function ContactLine() {
  return (
    <p>
      The operator is {OPERATOR_NAME}. Contact:{' '}
      <a className="underline decoration-stone-300 underline-offset-2" href={`mailto:${OPERATOR_CONTACT}`}>
        {OPERATOR_CONTACT}
      </a>
      .
    </p>
  );
}

function PrivacyBody() {
  return (
    <>
      <p>
        This policy describes how {OPERATOR_NAME} handles information when you use {PRODUCT_NAME} at{' '}
        <a className="underline decoration-stone-300 underline-offset-2" href={SITE_URL}>
          {SITE_HOST}
        </a>
        . {PRODUCT_NAME} is a free website for planning family meals.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Information we handle</h2>
      <p>
        If you create an account, we store the email and password you submit, together with meal plans and
        favourites you choose to save. If you use the planner without signing in, meal data may stay only
        in your browser. The hosting provider may keep standard technical logs, such as IP address, browser
        type, and the time of a request, to operate and secure the site.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Advertising</h2>
      <p>
        Public pages may show third-party display advertisements from Adsterra. Those ads load only after
        you accept advertising cookies in the consent banner. The ad network may set its own cookies and
        collect technical data about the request in order to serve and measure ads. We do not control the
        individual creatives. Advertising scripts are not mounted on sign-in, sign-up, or checkout routes.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Analytics</h2>
      <p>
        This site does not run analytics unless a GoatCounter site code is configured at build time. When
        that code is set, GoatCounter, a privacy-oriented analytics service that does not use cookies, may
        record cookieless pageviews such as the path and referrer. No first-party analytics beacon is used.
        Until a GoatCounter code is configured, we do not collect analytics pageviews.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Cookies and similar storage</h2>
      <p>
        The consent banner stores your advertising-cookie choice in your browser so the site can remember
        it. Account sign-in uses storage provided by our authentication service. Advertising cookies are
        used only after you accept. Details are on the{' '}
        <a className="underline decoration-stone-300 underline-offset-2" href="/cookies">
          cookie policy
        </a>
        .
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Contact</h2>
      <ContactLine />
    </>
  );
}

function TermsBody() {
  return (
    <>
      <p>
        These terms govern your use of {PRODUCT_NAME} at {SITE_HOST}, a free meal-planning website operated
        by {OPERATOR_NAME}. By using the site, you agree to these terms.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">The service</h2>
      <p>
        The planner is provided for personal, non-emergency use, to help organise meals and shopping lists.
        Recipe suggestions and third-party content are for general information. They are not medical,
        nutritional, or legal advice, and we do not promise that any recipe, ingredient list, or quantity
        is complete or suitable for you.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Accounts</h2>
      <p>
        If you create an account, you are responsible for the accuracy of the details you provide and for
        keeping access to that account secure. You may stop using the service at any time.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Acceptable use</h2>
      <p>
        You may not misuse the site, attempt to disrupt it, or use it to send unlawful or harmful material.
        Third-party ads and linked websites have their own terms.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Availability and liability</h2>
      <p>
        The site is provided as is, and we may change or withdraw features. To the extent permitted by law,{' '}
        {OPERATOR_NAME} is not liable for loss arising from your use of meal plans, recipes, or third-party
        ads or links, except where liability cannot be excluded.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Contact</h2>
      <ContactLine />
    </>
  );
}

function CookiesBody() {
  return (
    <>
      <p>
        This page describes cookies and similar storage used on {PRODUCT_NAME}. It should be read with the{' '}
        <a className="underline decoration-stone-300 underline-offset-2" href="/privacy">
          privacy policy
        </a>
        .
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Necessary storage</h2>
      <p>
        Your advertising-cookie choice is stored in your browser so the banner does not appear on every
        visit. If you sign in, the authentication service may use cookies or similar storage to keep you
        signed in. These are needed for those features to work.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Advertising cookies</h2>
      <p>
        After you accept, third-party display ads from Adsterra may set cookies and load scripts on public
        pages other than sign-in, sign-up, and checkout routes. If you reject ads, those scripts are not
        loaded.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Analytics</h2>
      <p>
        This site does not run analytics unless GoatCounter is enabled at build time. GoatCounter does not
        use cookies or a lasting advertising identifier. Until it is enabled, no analytics script is loaded.
      </p>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Change your choice</h2>
      <p>Use the buttons below to accept or reject advertising cookies.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200"
          onClick={() => setAdConsent('rejected')}
        >
          Reject ads
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-sm font-semibold text-white"
          onClick={() => setAdConsent('accepted')}
        >
          Accept ads
        </button>
      </div>
      <h2 className="pt-4 text-xl font-bold text-stone-800 dark:text-stone-100">Contact</h2>
      <ContactLine />
    </>
  );
}

export function LegalPage(props: LegalPageProps) {
  const { page } = props;
  return (
    <Shell {...props}>
      {page.slug === 'privacy' ? <PrivacyBody /> : null}
      {page.slug === 'terms' ? <TermsBody /> : null}
      {page.slug === 'cookies' ? <CookiesBody /> : null}
    </Shell>
  );
}
