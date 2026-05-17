function createScenario(title, introAlex, stageText) {
  return {
    title,
    introAlex,
    stages: stageText,
  }
}

const taskStages = [
  {
    title: 'Friendly outreach',
    text: 'A stranger offers quick social-media tasks with high pay and instant onboarding.',
    scammerLine: 'Hi Alex, fast task job. Earn today, no interview needed.',
    scammerThread: [
      'Hi Alex 👋 Quick remote task role, no interview needed.',
      'You can start in 10 minutes and get paid tonight.',
    ],
    phoneReply: 'Can you send your company site or ABN first?',
    alexTalk: [
      'I always check if a recruiter gives verifiable company details.',
      'When they rush me, that is usually a script.',
      'I’m 21 and study communication design in Melbourne, so I get many online offers.',
      'I learned to slow down first, then decide.',
    ],
    safeOption: 'Verify company via official website/ABN',
    riskOption: 'Move to private chat immediately',
    safeNote: 'Great. Independent verification blocks many scam chains.',
    riskNote: 'This usually starts the manipulation funnel.',
  },
  {
    title: 'Early reward bait',
    text: 'A dashboard shows instant earnings after tiny tasks.',
    scammerLine: 'See your balance? Keep going and earn more tonight.',
    scammerThread: [
      'See your balance? Keep going and earn more tonight.',
      'Finish 3 more tasks and we push your payout higher again.',
    ],
    phoneReply: 'Looks great... can I withdraw now?',
    alexTalk: [
      'A fake balance is emotionally powerful but technically easy to build.',
      'If withdrawals are blocked, the whole “profit” is fake.',
      'I keep screenshots so I can report patterns later.',
      'Excitement is normal, but I don’t let it control decisions.',
    ],
    safeOption: 'Test withdrawal terms first',
    riskOption: 'Keep increasing balance',
    safeNote: 'Correct. Withdrawal is the truth test.',
    riskNote: 'The hook is working exactly as scammers planned.',
  },
  {
    title: 'Verification fee demand',
    text: 'Alex is told to pay a platform fee to unlock funds.',
    scammerLine: 'Small verification fee now, then full payout unlocked.',
    scammerThread: [
      'Your account is successful ✅',
      'Just pay a $50 verification fee to unlock withdrawal.',
    ],
    phoneReply: 'Why do I have to pay before getting my own earnings?',
    alexTalk: [
      'Legit jobs do not ask me to pay to receive wages.',
      'Fee-before-withdrawal is one of the clearest warning signs.',
      'I tell friends: money out before money in = stop.',
      'The goal is to trigger sunk-cost thinking.',
    ],
    safeOption: 'Refuse payment and stop transfer',
    riskOption: 'Pay once to recover more',
    safeNote: 'Exactly right. Stop-loss prevents escalation.',
    riskNote: 'One payment often becomes repeated payments.',
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
      'Threat language is designed to bypass rational thinking.',
      'Scammers borrow authority words like legal, compliance, department.',
      'I never share identity files under pressure.',
      'At this point I block, record, and report.',
    ],
    safeOption: 'Block/report and secure accounts',
    riskOption: 'Send ID to avoid trouble',
    safeNote: 'Good move. Containment comes first.',
    riskNote: 'ID leakage may lead to secondary fraud.',
  },
  {
    title: 'Recovery choice',
    text: 'Alex decides whether to stop and report or keep negotiating.',
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
  },
]

export const SCAM_SIMULATION_SCENARIOS = {
  task_based: createScenario(
    'Task-based job scam',
    [
      'Hey — I’m Alex, 21, from Melbourne. Uni by day, café shifts on weekends.',
      'I’m not a lawyer or cop. I’m exactly the kind of person these scammers target.',
      'I’ve seen classmates lose money to “easy task jobs”, so I started collecting scam scripts.',
      'I’ll guide this like a friend-to-friend chat: practical, fast, zero jargon.',
      'If you can spot what I spot, you can protect yourself earlier than I did.',
    ],
    taskStages,
  ),
  phishing: createScenario(
    'Phishing recruiter scam',
    [
      'I also got fake interview links that looked almost real.',
      'My advantage now is pattern memory: odd domain, urgency, repeated login prompts.',
      'I’ll show you where the trap appears before damage starts.',
      'You don’t need technical expertise—just a strong pause habit.',
      'Let’s practice it together.',
    ],
    taskStages,
  ),
  financial_fraud: createScenario(
    'Fake payroll / upfront fee scam',
    [
      'In my second year, I nearly paid an onboarding fee for a fake remote role.',
      'That experience taught me fee-based onboarding is a giant red flag.',
      'I now benchmark every request against normal employer behavior.',
      'In this simulation I’ll point out where pressure replaces logic.',
      'You can copy this checklist later for real job searches.',
    ],
    taskStages,
  ),
  identity_scam: createScenario(
    'Identity harvesting scam',
    [
      'Scammers once asked me for passport + selfie + utility bill in one go.',
      'That over-collection style is now easy for me to recognize.',
      'I’ll show you exactly how to guard your identity documents.',
      'Think “minimum data, maximum verification.”',
      'We’re training safe boundaries, not fear.',
    ],
    taskStages,
  ),
  investment: createScenario(
    'Job-to-investment hybrid scam',
    [
      'I’ve seen fake recruiters mix jobs with “guaranteed investment channels.”',
      'That blend is persuasive because it borrows trust from employment language.',
      'I now split every mixed offer into separate risk checks.',
      'In this walkthrough, I’ll call out each emotional trigger.',
      'By the end, you’ll read the script before it reads you.',
    ],
    taskStages,
  ),
}
