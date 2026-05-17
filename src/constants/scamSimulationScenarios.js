function createScenario(title, introAlex, stageText) {
  return {
    title,
    introAlex,
    stages: stageText,
  }
}

function createScenarioWithMeta({
  title,
  introAlex,
  introAlexMobile,
  stages,
  scenarioLabel,
  typeTone,
  summarySeed,
  topRiskSeed,
  nextActionSeed,
  closingSeed,
  lowRiskHarmBullets,
}) {
  return {
    ...createScenario(title, introAlex, stages),
    introAlexMobile,
    scenarioLabel,
    typeTone,
    summarySeed,
    topRiskSeed,
    nextActionSeed,
    closingSeed,
    lowRiskHarmBullets: Array.isArray(lowRiskHarmBullets)
      ? lowRiskHarmBullets.map((line) => String(line || '').trim()).filter(Boolean)
      : [],
  }
}

const taskStages = [
  {
    title: 'Friendly outreach',
    text: 'A stranger offers fast pay with no interview.',
    scammerLine: 'Hi Alex, fast task job. Earn today, no interview needed.',
    scammerThread: [
      'Hi Alex 👋 Quick remote task role, no interview needed.',
      'You can start in 10 minutes and get paid tonight.',
    ],
    phoneReply: 'Can you send your company site or ABN first?',
    alexTalk: [
      'I should verify the company before replying.',
      'When they rush me, that is usually a script.',
      'I’m 21 and study communication design in Melbourne, so I get many online offers.',
      'I learned to slow down first, then decide.',
    ],
    safeOption: 'Verify company via official website / ABN',
    riskOption: 'Move to private chat immediately',
    safeNote: 'Great. Independent verification blocks many scam chains.',
    riskNote: 'This usually starts the manipulation funnel.',
    riskTag: 'Unverified outreach',
    riskReason:
      'High reward + instant onboarding is a common scam hook.',
    mobile: {
      text: 'A stranger offers fast pay with no interview.',
      riskReason: 'High reward + instant onboarding is a common scam hook.',
      alexThink: 'I should verify the company before replying.',
      thread: [
        { role: 'scammer', text: 'Hi Alex 👋 Quick task role — no interview.' },
        { role: 'scammer', text: 'Start in 10 min — get paid tonight.' },
        { role: 'alex', text: 'Can you send your company site or ABN first?' },
      ],
    },
    safeAction:
      'Pause and verify identity through official company website, ABN lookup, and public job listings.',
    learningPoint: 'Verify identity first. Speed and friendliness are not proof of legitimacy.',
    summarySeed:
      'This stage uses friendly urgency and low entry barriers to quickly lower critical thinking.',
  },
  {
    title: 'Early reward bait',
    text: 'A dashboard shows fake earnings after tiny tasks.',
    scammerLine: 'See your balance? Keep going and earn more tonight.',
    scammerThread: [
      'See your balance? Keep going and earn more tonight.',
      'Finish 3 more tasks and we push your payout higher again.',
    ],
    phoneReply: 'Looks great... can I withdraw now?',
    alexTalk: [
      'I need to test withdrawal before doing more tasks.',
      'If withdrawals are blocked, the whole “profit” is fake.',
      'I keep screenshots so I can report patterns later.',
      'Excitement is normal, but I don’t let it control decisions.',
    ],
    safeOption: 'Test withdrawal terms first',
    riskOption: 'Keep increasing balance',
    safeNote: 'Correct. Withdrawal is the truth test.',
    riskNote: 'The hook is working exactly as scammers planned.',
    riskTag: 'Fake earnings bait',
    riskReason: 'Balance growth without a real withdrawal is a classic bait.',
    mobile: {
      text: 'A dashboard shows fake earnings after tiny tasks.',
      riskReason: 'Balance growth without a real withdrawal is a classic bait.',
      alexThink: 'I need to test withdrawal before doing more tasks.',
      thread: [
        { role: 'scammer', text: 'See your balance? Keep going tonight.' },
        { role: 'scammer', text: 'Finish 3 tasks — payout goes higher.' },
        { role: 'alex', text: 'Can I withdraw now?' },
      ],
    },
    safeAction:
      'Check withdrawal rules and test payout once before completing more tasks or following new instructions.',
    learningPoint:
      'Displayed profit is not real profit until withdrawal succeeds in a trusted channel.',
    summarySeed:
      'This stage uses instant reward visuals to push continued engagement and weaken verification behavior.',
  },
  {
    title: 'Verification fee demand',
    text: 'Alex must pay a fee to unlock withdrawal.',
    scammerLine: 'Small verification fee now, then full payout unlocked.',
    scammerThread: [
      'Your account is successful ✅',
      'Just pay a $50 verification fee to unlock withdrawal.',
    ],
    phoneReply: 'Why do I have to pay before getting my own earnings?',
    alexTalk: [
      'Legit jobs never ask me to pay to receive wages.',
      'Fee-before-withdrawal is one of the clearest warning signs.',
      'I tell friends: money out before money in = stop.',
      'The goal is to trigger sunk-cost thinking.',
    ],
    safeOption: 'Refuse payment and stop transfer',
    riskOption: 'Pay once to recover more',
    safeNote: 'Exactly right. Stop-loss prevents escalation.',
    riskNote: 'One payment often becomes repeated payments.',
    riskTag: 'Pay-to-unlock demand',
    riskReason: 'Fees before payout are a common extraction tactic.',
    mobile: {
      text: 'Alex must pay a fee to unlock withdrawal.',
      riskReason: 'Fees before payout are a common extraction tactic.',
      alexThink: 'Legit jobs never ask me to pay to receive wages.',
      thread: [
        { role: 'scammer', text: 'Account successful ✅' },
        { role: 'scammer', text: 'Pay $50 fee to unlock withdrawal.' },
        { role: 'alex', text: 'Why pay before my own earnings?' },
      ],
    },
    safeAction:
      'Refuse payment, stop transfers immediately, and validate whether the employer follows normal payroll practices.',
    learningPoint: 'Legitimate employers do not require upfront payment to release wages.',
    summarySeed:
      'This stage reframes theft as a small compliance fee to trigger sunk-cost and recovery bias.',
  },
  {
    title: 'Threat escalation',
    text: 'A fake legal team threatens penalties and asks for ID.',
    scammerLine: 'FINAL WARNING: comply in 30 mins or legal action starts.',
    scammerThread: [
      'FINAL WARNING: Legal Department will proceed in 30 minutes.',
      'Submit passport + selfie now to avoid penalties.',
    ],
    phoneReply: 'This is getting threatening. I should stop this now.',
    alexTalk: [
      'I never share identity files under pressure.',
      'Scammers borrow authority words like legal, compliance, department.',
      'Threat language is designed to bypass rational thinking.',
      'At this point I block, record, and report.',
    ],
    safeOption: 'Block/report and secure accounts',
    riskOption: 'Send ID to avoid trouble',
    safeNote: 'Good move. Containment comes first.',
    riskNote: 'ID leakage may lead to secondary fraud.',
    riskTag: 'Threat and pressure escalation',
    riskReason: 'Legal threats and countdowns force fast compliance.',
    mobile: {
      text: 'A fake legal team threatens penalties and asks for ID.',
      riskReason: 'Legal threats and countdowns force fast compliance.',
      alexThink: 'I never share identity files under pressure.',
      thread: [
        { role: 'scammer', text: 'FINAL WARNING: Legal in 30 minutes.' },
        { role: 'scammer', text: 'Send passport + selfie now.' },
        { role: 'alex', text: 'This is threatening — I should stop.' },
      ],
    },
    safeAction:
      'Stop interaction, keep evidence, secure accounts, and avoid sharing identity documents or one-time codes.',
    learningPoint: 'When pressure rises, slow down and move to official reporting channels.',
    summarySeed:
      'This stage weaponizes authority language and urgency to override rational decision-making.',
  },
  {
    title: 'Recovery choice',
    text: 'Alex must stop negotiating or pay one last time.',
    scammerLine: 'Last transfer now and we release everything.',
    scammerThread: [
      'Last transfer now and we release everything.',
      'If you stop now, your account is permanently frozen.',
    ],
    phoneReply: 'No more payments. I’m preserving evidence and reporting.',
    alexTalk: [
      'I choose formal channels over emotional negotiation.',
      'Banks and official reporting lines are more useful than arguing with scammers.',
      'I keep timeline notes to help investigations.',
      'Stopping early is a strength, not a failure.',
    ],
    safeOption: 'Report + keep evidence',
    riskOption: 'Try one final negotiation',
    safeNote: 'Great ending. You regained control.',
    riskNote: 'Final-negotiation loops usually deepen losses.',
    riskTag: 'Last payment trap',
    riskReason: 'One “final” payment usually extends the scam cycle.',
    mobile: {
      text: 'Alex must stop negotiating or pay one last time.',
      riskReason: 'One “final” payment usually extends the scam cycle.',
      alexThink: 'I choose formal channels over emotional negotiation.',
      thread: [
        { role: 'scammer', text: 'Last transfer — we release everything.' },
        { role: 'scammer', text: 'Stop now and your account is frozen.' },
        { role: 'alex', text: 'No more payments. I’m reporting.' },
      ],
    },
    safeAction:
      'Exit communication, preserve timeline evidence, and report through official channels immediately.',
    learningPoint:
      'Loss containment starts when you stop negotiating and switch to formal support pathways.',
    summarySeed:
      'The final stage attempts to convert regret into one more payment or disclosure decision.',
  },
]

export const SCAM_SIMULATION_SCENARIOS = {
  task_based: createScenarioWithMeta({
    title: 'Task-based job scam',
    introAlexMobile:
      'Hey — I’m Alex, 21, from Melbourne. I’m the kind of person scammers target, and I’ll guide this like a practical friend chat.',
    introAlex: [
      'Hey — I’m Alex, 21, from Melbourne. Uni by day, café shifts on weekends.',
      'I’m not a lawyer or cop. I’m exactly the kind of person these scammers target.',
      'I’ve seen classmates lose money to “easy task jobs”, so I started collecting scam scripts.',
      'I’ll guide this like a friend-to-friend chat: practical, fast, zero jargon.',
      'If you can spot what I spot, you can protect yourself earlier than I did.',
    ],
    stages: taskStages,
    scenarioLabel: 'Task-Based Scam',
    typeTone:
      'Looks like simple paid tasks but gradually pushes users into fee and withdrawal loops.',
    summarySeed: 'Users are often drawn in by low friction onboarding and fast payout claims.',
    topRiskSeed: 'Trusting high-return claims before validating payout reality.',
    nextActionSeed: 'Always verify withdrawal terms before committing more effort or payment.',
    closingSeed: 'Task scam scripts are designed to keep users chasing “almost unlocked” earnings.',
    lowRiskHarmBullets: [
      '“Too easy cash” onboarding still builds a dossier about you even when you dodge fees.',
      'Early tasks normalise obedience so later pressure slips past your scepticism.',
      'They farm screenshots, chats, device habits—useful fuel for phishing or impersonation.',
      'The script doesn’t disappear if you dodge one fee; recruiters often resurface under fresh names.',
    ],
  }),
  phishing: createScenarioWithMeta({
    title: 'Phishing recruiter scam',
    introAlexMobile:
      'I got fake interview links that looked almost real. I’ll show you where the trap appears before damage starts.',
    introAlex: [
      'I also got fake interview links that looked almost real.',
      'My advantage now is pattern memory: odd domain, urgency, repeated login prompts.',
      'I’ll show you where the trap appears before damage starts.',
      'You don’t need technical expertise—just a strong pause habit.',
      'Let’s practice it together.',
    ],
    stages: taskStages,
    scenarioLabel: 'Phishing Scam',
    typeTone:
      'Fake links and login prompts are used to capture credentials, identity data, and one-time codes.',
    summarySeed:
      'Users are most exposed when they follow urgent login or verification prompts without checking domains.',
    topRiskSeed: 'Submitting credentials to unverified pages under urgency pressure.',
    nextActionSeed:
      'Use official domains directly instead of links sent in chat or unsolicited messages.',
    closingSeed:
      'Phishing succeeds when fake workflows feel familiar enough to bypass verification habits.',
    lowRiskHarmBullets: [
      'Even “harmless clicks” fingerprint your devices and deepen believable spoofed pages.',
      'Clone sites borrow real careers branding so skim-reading domain bars isn’t enough.',
      'Captured emails often feed password-spray attacks across gaming, uni, banking logins.',
      'One missed pause now becomes months of dormant account chatter on dark-web markets.',
      'Assume every unexpected login prompt is contested until typed URL + HTTPS certificate pass.',
    ],
  }),
  financial_fraud: createScenarioWithMeta({
    title: 'Fake payroll / upfront fee scam',
    introAlexMobile:
      'In my second year, I almost paid an onboarding fee for a fake remote job. It taught me that fee-based onboarding is a major red flag.',
    introAlex: [
      'In my second year, I nearly paid an onboarding fee for a fake remote role.',
      'That experience taught me fee-based onboarding is a giant red flag.',
      'I now benchmark every request against normal employer behavior.',
      'In this simulation I’ll point out where pressure replaces logic.',
      'You can copy this checklist later for real job searches.',
    ],
    stages: taskStages,
    scenarioLabel: 'Financial Fraud Scam',
    typeTone:
      'Scammers frame payment requests as payroll setup, compliance, or account activation requirements.',
    summarySeed:
      'Users are often pressured to pay small “unlock” fees that expand into repeated transfers.',
    topRiskSeed: 'Accepting pay-before-payroll narratives as legitimate hiring behavior.',
    nextActionSeed:
      'Compare payment requests against standard employer payroll and onboarding processes.',
    closingSeed:
      'Real employers pay workers; they do not request activation fees to release wages.',
    lowRiskHarmBullets: [
      '“Pay-to-onboard” language hijacks empathy—making you fear losing a dream internship.',
      'Legit payroll tweaks never demand personal transfers to unblock wages.',
      'They train you to treat abnormal finance flows as harmless admin.',
      'Stopping early denies them tax-file numbers, scanned IDs, banking metadata.',
      'Treat every payroll anomaly as deserving a live HR call on a sourced mainline.',
    ],
  }),
  identity_scam: createScenarioWithMeta({
    title: 'Identity harvesting scam',
    introAlexMobile:
      'Scammers once asked for passport, selfie, and utility bill in one go. I teach minimum data and maximum verification.',
    introAlex: [
      'Scammers once asked me for passport + selfie + utility bill in one go.',
      'That over-collection style is now easy for me to recognize.',
      'I’ll show you exactly how to guard your identity documents.',
      'Think “minimum data, maximum verification.”',
      'We’re training safe boundaries, not fear.',
    ],
    stages: taskStages,
    scenarioLabel: 'Identity Scam',
    typeTone:
      'The core objective is collecting identity documents for secondary fraud and account misuse.',
    summarySeed:
      'Users face elevated risk when asked for excessive documents without trusted legal necessity.',
    topRiskSeed: 'Sharing full identity packages in high-pressure chat contexts.',
    nextActionSeed:
      'Share only minimum required data after confirming legal basis and organization authenticity.',
    closingSeed:
      'Identity abuse can continue long after the first incident, so prevention and containment are critical.',
    lowRiskHarmBullets: [
      'They weaponise Aussie trust by collecting “everything at once”: licence, selfies, Medicare hints.',
      'Even partial dossiers enable synthetic borrowers or telco swaps on your IDs.',
      'Young renters are prime because document sets already live digitally for legitimate landlords.',
      'Once shared, revocation is mythical—assume persistent exposure cycles.',
      'Minimum-data discipline beats politeness whenever someone demands speed over purpose.',
    ],
  }),
  investment: createScenarioWithMeta({
    title: 'Job-to-investment hybrid scam',
    introAlexMobile:
      'I’ve seen fake recruiters mix jobs with “guaranteed investment” channels. I’ll call out each emotional trigger in this walkthrough.',
    introAlex: [
      'I’ve seen fake recruiters mix jobs with “guaranteed investment channels.”',
      'That blend is persuasive because it borrows trust from employment language.',
      'I now split every mixed offer into separate risk checks.',
      'In this walkthrough, I’ll call out each emotional trigger.',
      'By the end, you’ll read the script before it reads you.',
    ],
    stages: taskStages,
    scenarioLabel: 'Investment Hybrid Scam',
    typeTone:
      'Scammers blend employment language with investment promises to justify continuous capital input.',
    summarySeed:
      'Users are vulnerable when guaranteed returns are framed as part of work performance or bonus tracks.',
    topRiskSeed: 'Treating guaranteed-return investment claims as legitimate job components.',
    nextActionSeed:
      'Separate job validation from investment claims and verify licenses through official regulators.',
    closingSeed:
      'Hybrid scripts are persuasive because they merge financial greed, urgency, and career trust signals.',
    lowRiskHarmBullets: [
      'Hybrid pitches blend “shift schedule” jargon with phantom broker dashboards.',
      'Recruiters impersonate mentorship while routing you toward unlicensed pooled wallets.',
      'They leverage “team targets” guilt so scepticism reads as betrayal.',
      'You must untangle payroll promises from sideways capital calls—the story trains you not to.',
      'Any role that casually introduces trading channels fails the simplicity sniff test.',
    ],
  }),
}
