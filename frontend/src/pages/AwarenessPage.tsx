import { useState } from 'react';
import {
  AlertOctagon,
  Award,
  CheckCircle2,
  Eye,
  GlobeLock,
  KeyRound,
  MailWarning,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { GlassCard, StatusBadge } from '@/components';

const PHISHING_TYPES = [
  {
    title: 'Deceptive Bulk & Spear Phishing',
    description:
      'Fraudulent emails impersonating banks, cloud providers, or campus IT departments to harvest login credentials or payment details.',
    icon: MailWarning,
  },
  {
    title: 'Smishing & Vishing',
    description:
      'SMS text messages or voice calls claiming urgent delivery failures, account locks, or tax penalties to rush victims into clicking links.',
    icon: Smartphone,
  },
  {
    title: 'Homograph & Lookalike Domains',
    description:
      'Domains substituting visually similar characters or appending trusted brand words before an unrelated top-level domain.',
    icon: GlobeLock,
  },
  {
    title: 'Adversary-in-the-Middle (AiTM)',
    description:
      'Reverse-proxy phishing pages that relay real login prompts and intercept session cookies even when one-time passcodes are entered.',
    icon: AlertOctagon,
  },
];

const URL_ANATOMY_SEGMENTS = [
  {
    id: 'protocol',
    text: 'hxxps://',
    label: 'Scheme Misdirection',
    risk: 'Warning',
    explanation:
      'Attackers routinely obtain free TLS certificates so the browser padlock appears, proving encryption in transit—not domain trustworthiness.',
  },
  {
    id: 'subdomain',
    text: 'login.microsoft-security-verify',
    label: 'Spoofed Subdomain',
    risk: 'High Risk',
    explanation:
      'Brand names placed to the left of the registrable domain are arbitrary subdomains controlled entirely by whoever owns the root domain.',
  },
  {
    id: 'domain',
    text: '.account-check[.]example[.]com',
    label: 'True Registrable Domain',
    risk: 'Critical Indicator',
    explanation:
      'Always read the segment immediately before the first single slash (`/`). Here the real host is `account-check.example.com`, not Microsoft.',
  },
  {
    id: 'path',
    text: '/oauth2/confirm?redirect=token_892a',
    label: 'Deceptive Path & Query',
    risk: 'Moderate Signal',
    explanation:
      'Familiar endpoints such as `/oauth2` or `/signin` and opaque redirect parameters mimic legitimate SSO authentication flows.',
  },
];

const SUSPICIOUS_INDICATORS = [
  'The registrable domain immediately preceding the first `/` does not match the organization claiming to send the message.',
  'Raw IPv4 addresses or excessive hyphenated subdomains appear in place of a recognizable corporate domain.',
  'Shortened URLs or open-redirect query parameters obscure the final destination.',
  'Urgent threats ("account suspended within 2 hours") pressure you to skip verifying the link.',
  'Subtle character swaps such as `rn` for `m`, `0` for `O`, or unfamiliar country-code TLDs.',
];

const INCIDENT_STEPS = [
  'Disconnect the device from Wi-Fi or Ethernet if any executable or unexpected file was downloaded.',
  'Change the compromised account password immediately from a separate, clean device—never via the same link.',
  'Revoke active sessions, OAuth app permissions, and API tokens; enable hardware or app-based MFA.',
  'Notify your IT security team or financial institution if credentials, card numbers, or OTPs were entered.',
  'Monitor account audit logs and run a full endpoint malware scan before resuming normal sessions.',
];

interface QuizQuestion {
  id: number;
  scenario: string;
  fictionalExample: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    scenario:
      'You receive an urgent campus IT notice asking you to re-verify your student SSO password at the non-clickable address below:',
    fictionalExample: 'hxxps://sso[.]university-portal[.]verify-session[.]example[.]org/login',
    options: [
      'Safe — it uses HTTPS and starts with sso.university-portal',
      'Phishing indicator — the real registrable domain is verify-session[.]example[.]org',
      'Safe — .org domains are always verified educational institutions',
    ],
    correctIndex: 1,
    explanation:
      'Subdomains to the left (`sso.university-portal`) can be created freely by the owner of `verify-session.example.org`. Always check the registrable domain right before the first slash.',
  },
  {
    id: 2,
    scenario:
      'An invoice email instructs you to review a billing update at the following defanged IP-based link:',
    fictionalExample: 'hxxp://198[.]51[.]100[.]24/billing/invoice-download.html',
    options: [
      'Suspicious — legitimate cloud billing portals rarely serve login flows over raw unencrypted IPv4 addresses',
      'Safe — numeric IP addresses are faster and more secure than domain names',
      'Safe — the `.html` extension guarantees no scripts can run',
    ],
    correctIndex: 0,
    explanation:
      'Using a raw IP address over unencrypted HTTP for sensitive billing or credential pages is a strong phishing and malicious hosting signal.',
  },
  {
    id: 3,
    scenario:
      'Which statement is true when a suspicious link begins with `https://` and displays a browser padlock icon?',
    fictionalExample: 'hxxps://paypa1-support-desk[.]example[.]net/restore',
    options: [
      'The website identity has been verified as the official brand by the browser',
      'Traffic is encrypted in transit, but the domain itself can still be operated by an attacker',
      'Phishing sites cannot obtain SSL/TLS certificates',
    ],
    correctIndex: 1,
    explanation:
      'TLS certificates validate encryption between your browser and whichever server owns that domain—even if the domain (`paypa1-support-desk`) is a typosquatted lookalike.',
  },
  {
    id: 4,
    scenario:
      'You receive a message claiming your bank account is locked, containing an unrecognized link. What is the safest way to check your account?',
    fictionalExample: 'SMS: "Action required: confirm identity at hxxps://secure-bank-alert[.]example[.]com"',
    options: [
      'Click the link in incognito mode so cookies cannot be stolen',
      'Open a new tab and type your bank official domain manually or use a saved bookmark',
      'Reply to the SMS asking whether the link is genuine',
    ],
    correctIndex: 1,
    explanation:
      'Incognito mode does not protect against entering credentials on a fake site. Always navigate independently via a trusted bookmark or manually typed official domain.',
  },
  {
    id: 5,
    scenario:
      'If you accidentally typed your password into a suspected phishing form 5 minutes ago, what should be your FIRST containment action?',
    fictionalExample: 'Credential entry occurred on hxxps://cloud-drive-share[.]example[.]net/auth',
    options: [
      'Clear your browser history and wait to see if anything happens',
      'Immediately change the password from a clean session, revoke active sessions, and check MFA settings',
      'Keep the same password if you already have SMS alerts turned on',
    ],
    correctIndex: 1,
    explanation:
      'Clearing history only removes local traces; attackers already possess the submitted password. Immediately rotate credentials, invalidate active sessions, and verify MFA.',
  },
];

export function AwarenessPage() {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(URL_ANATOMY_SEGMENTS[1].id);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  const activeSegment =
    URL_ANATOMY_SEGMENTS.find((seg) => seg.id === selectedSegmentId) ?? URL_ANATOMY_SEGMENTS[0];
  const currentQuestion = QUIZ_QUESTIONS[questionIndex];
  const chosenOption = answers[currentQuestion.id];

  const totalCorrect = QUIZ_QUESTIONS.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;

  const handleSelectOption = (optionIdx: number) => {
    if (chosenOption !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIdx }));
  };

  const handleNextQuestion = () => {
    if (questionIndex < QUIZ_QUESTIONS.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setQuestionIndex(0);
    setQuizCompleted(false);
  };

  return (
    <div className="space-y-6">
      {/* Intro: What is Phishing */}
      <GlassCard accent="cyan" padding="lg">
        <div className="max-w-3xl">
          <StatusBadge variant="info" label="Cybersecurity Awareness Center" />
          <h2 className="mt-3 text-2xl font-bold text-text-primary">What is Phishing?</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Phishing is a social engineering attack in which adversaries craft deceptive websites,
            emails, or text messages impersonating trusted institutions to steal credentials,
            session tokens, financial details, or trigger malware downloads. Because modern
            phishing kits rotate domains rapidly, combining automated ML inspection with user
            vigilance is essential.
          </p>
        </div>
      </GlassCard>

      {/* Common Types of Phishing */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-text-primary">
          Common Types of Phishing Attacks
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PHISHING_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} hover>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-3.5 text-sm font-semibold text-text-primary">{item.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                  {item.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* How Phishing Links Deceive Users (Interactive Anatomy) */}
      <GlassCard accent="violet" padding="lg">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              How Phishing Links Deceive Users
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Select any segment of this fictional, non-clickable defanged URL to inspect the
              deception technique.
            </p>
          </div>
          <span className="font-mono text-[11px] text-text-muted">
            Non-clickable educational sample
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-secondary/70 p-4 font-mono text-xs sm:text-sm">
          {URL_ANATOMY_SEGMENTS.map((seg) => {
            const isSelected = seg.id === activeSegment.id;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => setSelectedSegmentId(seg.id)}
                className={`rounded-lg px-2.5 py-1.5 text-left transition-all ${
                  isSelected
                    ? 'border border-accent-primary bg-accent-primary/15 text-accent-primary shadow-glow'
                    : 'border border-transparent bg-bg-elevated/80 text-text-secondary hover:border-border-strong'
                }`}
              >
                {seg.text}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">{activeSegment.label}</p>
            <StatusBadge variant="warning" label={activeSegment.risk} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
            {activeSegment.explanation}
          </p>
        </div>
      </GlassCard>

      {/* How to Identify + Security Best Practices */}
      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-6">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-accent-primary" />
            <h3 className="text-base font-semibold text-text-primary">
              How to Identify Suspicious URLs
            </h3>
          </div>
          <ul className="mt-4 space-y-3">
            {SUSPICIOUS_INDICATORS.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2.5 text-xs leading-relaxed text-text-secondary sm:text-sm"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="lg:col-span-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-status-success" />
            <h3 className="text-base font-semibold text-text-primary">
              What to Do After Clicking a Suspicious Link
            </h3>
          </div>
          <ol className="mt-4 space-y-3">
            {INCIDENT_STEPS.map((step, idx) => (
              <li
                key={step}
                className="flex items-start gap-3 text-xs leading-relaxed text-text-secondary sm:text-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent-primary/40 bg-accent-primary/10 font-mono text-[11px] font-bold text-accent-primary">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>

      {/* Email, Password, Safe Browsing Tips */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard hover>
          <div className="flex items-center gap-2 text-accent-primary">
            <MailWarning className="h-5 w-5" />
            <h3 className="text-sm font-semibold text-text-primary">Email Security Tips</h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-muted">
            <li>• Inspect the full sender email domain, not just the display name.</li>
            <li>• Never open unexpected macro-enabled documents or ZIP archives.</li>
            <li>• Verify urgent payment or password requests through a separate channel.</li>
          </ul>
        </GlassCard>

        <GlassCard hover>
          <div className="flex items-center gap-2 text-accent-secondary">
            <KeyRound className="h-5 w-5" />
            <h3 className="text-sm font-semibold text-text-primary">Password Security Tips</h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-muted">
            <li>• Use unique 14+ character passphrases stored in a reputable password manager.</li>
            <li>• Password managers refuse to auto-fill on lookalike phishing domains.</li>
            <li>• Prefer FIDO2 passkeys or authenticator apps over SMS one-time codes.</li>
          </ul>
        </GlassCard>

        <GlassCard hover>
          <div className="flex items-center gap-2 text-status-success">
            <GlobeLock className="h-5 w-5" />
            <h3 className="text-sm font-semibold text-text-primary">Safe Browsing Guidelines</h3>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-muted">
            <li>• Keep browser security patches and DNS filtering active.</li>
            <li>• Scan unfamiliar links with PhishGuard before loading them directly.</li>
            <li>• Bookmark banking, cloud, and university login portals instead of using search ads.</li>
          </ul>
        </GlassCard>
      </div>

      {/* Interactive Phishing Awareness Quiz (Fictional Non-Clickable Examples) */}
      <GlassCard accent="cyan" padding="lg">
        <div className="flex flex-col justify-between gap-3 border-b border-border-subtle pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-primary">
              Interactive Training Module
            </span>
            <h3 className="mt-1 text-lg font-bold text-text-primary">
              Phishing Detection Awareness Quiz
            </h3>
            <p className="text-xs text-text-muted">
              All examples below are fictional and defanged (`hxxps://`, `[.]`) — strictly
              non-clickable for safety.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-text-secondary">
            Question {Math.min(questionIndex + 1, QUIZ_QUESTIONS.length)} of {QUIZ_QUESTIONS.length}
          </span>
        </div>

        {quizCompleted ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-primary/40 bg-accent-primary/10 text-accent-primary">
              <Award className="h-7 w-7" />
            </div>
            <h4 className="mt-4 text-xl font-bold text-text-primary">
              Quiz Complete: {totalCorrect} / {QUIZ_QUESTIONS.length} Correct
            </h4>
            <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">
              {totalCorrect === QUIZ_QUESTIONS.length
                ? 'Excellent threat recognition. You correctly spotted domain spoofing, TLS misconceptions, and containment priorities.'
                : 'Review the URL anatomy section above and retake the quiz to reinforce safe verification habits.'}
            </p>
            <button
              type="button"
              onClick={handleResetQuiz}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-primary px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <p className="text-sm font-medium text-text-primary">{currentQuestion.scenario}</p>

            <div className="rounded-xl border border-border-subtle bg-bg-secondary/70 px-4 py-3 font-mono text-xs text-accent-primary select-all">
              {currentQuestion.fictionalExample}
            </div>

            <div className="space-y-2.5">
              {currentQuestion.options.map((option, idx) => {
                const isAnswered = chosenOption !== undefined;
                const isSelected = chosenOption === idx;
                const isCorrect = idx === currentQuestion.correctIndex;

                let optionClasses =
                  'border-border-subtle bg-bg-elevated/80 text-text-secondary hover:border-accent-primary/40 hover:text-text-primary';

                if (isAnswered) {
                  if (isCorrect) {
                    optionClasses =
                      'border-status-success/50 bg-status-success/10 text-text-primary';
                  } else if (isSelected && !isCorrect) {
                    optionClasses =
                      'border-status-danger/50 bg-status-danger/10 text-text-primary';
                  } else {
                    optionClasses = 'border-border-subtle bg-bg-secondary/30 text-text-muted';
                  }
                }

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-xs font-medium transition-colors sm:text-sm ${optionClasses}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 shrink-0 text-status-danger" />
                    )}
                  </button>
                );
              })}
            </div>

            {chosenOption !== undefined && (
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-accent-primary/30 bg-accent-primary/5 p-4 sm:flex-row sm:items-center">
                <p className="text-xs leading-relaxed text-text-secondary">
                  <strong className="text-text-primary">Explanation: </strong>
                  {currentQuestion.explanation}
                </p>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="shrink-0 rounded-xl bg-accent-primary px-4 py-2 text-xs font-bold text-white dark:text-slate-950"
                >
                  {questionIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Results'}
                </button>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
