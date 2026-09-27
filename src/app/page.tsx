import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mailroom-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Mailroom home">
          <span className="wordmark-mark" aria-hidden="true">
            m
          </span>
          <span>mailroom</span>
        </Link>
        <nav className="account-actions" aria-label="Account">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="button button-quiet">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="button button-dark">Create account</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link className="button button-quiet" href="/dashboard">
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </nav>
      </header>

      <main className="home-main">
        <section className="intro" aria-labelledby="home-title">
          <div className="intro-copy">
            <p className="eyebrow">
              <span className="status-dot" /> A calmer kind of inbox
            </p>
            <h1 id="home-title">
              Make space for <em>good</em> mail.
            </h1>
            <p className="intro-description">
              A thoughtful home for your conversations. Sign in to pick up where
              you left off, or create an account to get started.
            </p>
            <div className="intro-actions">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="button button-coral">
                    Open your inbox <span aria-hidden="true">&#8594;</span>
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="text-link">
                    I already have an account
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <p className="signed-in-note">
                  You’re signed in. Your inbox is ready.
                </p>
              </Show>
            </div>
            <div className="privacy-note">
              <span aria-hidden="true">&#10003;</span> Your conversations stay
              yours
            </div>
          </div>

          <div
            className="inbox-art"
            aria-label="An illustration of a neatly organized inbox"
          >
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="mail-stack">
              <div className="mail-sheet mail-sheet-back" />
              <div className="mail-sheet mail-sheet-middle" />
              <div className="mail-sheet mail-sheet-front">
                <div className="sheet-topline">
                  <span>INBOX</span>
                  <span className="sheet-count">03</span>
                </div>
                <div className="sheet-rule" />
                <div className="mail-row">
                  <span className="mail-avatar avatar-coral">S</span>
                  <span className="mail-lines">
                    <i />
                    <i />
                  </span>
                  <span className="mail-time">9:41</span>
                </div>
                <div className="mail-row">
                  <span className="mail-avatar avatar-blue">J</span>
                  <span className="mail-lines">
                    <i />
                    <i />
                  </span>
                  <span className="mail-time">9:18</span>
                </div>
                <div className="mail-row">
                  <span className="mail-avatar avatar-yellow">A</span>
                  <span className="mail-lines">
                    <i />
                    <i />
                  </span>
                  <span className="mail-time">8:56</span>
                </div>
                <div className="sheet-footer">
                  <span /> All caught up, for now
                </div>
              </div>
              <div className="art-stamp" aria-hidden="true">
                M
              </div>
            </div>
            <p className="art-caption">
              A little less noise.
              <br />A little more signal.
            </p>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        <span>
          MAILROOM <span className="footer-separator">/</span> YOUR PERSONAL
          INBOX
        </span>
        <span>Made for the messages that matter.</span>
      </footer>
    </div>
  );
}
