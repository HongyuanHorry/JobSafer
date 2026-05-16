export const scamTypeMeta = {
  phishing: {
    label: 'Phishing',
    tone: 'Credential theft and fake login capture',
  },
  financial_fraud: {
    label: 'Financial Fraud',
    tone: 'Fake checks, overpayments, and payment redirection',
  },
  task_based: {
    label: 'Task-Based Scam',
    tone: 'Micro-task payouts that turn into deposits',
  },
  identity_scam: {
    label: 'Identity Scam',
    tone: 'Document harvesting and impersonation setup',
  },
  investment: {
    label: 'Investment Scam',
    tone: 'Guaranteed returns and pressure to add funds',
  },
}

export const scamSimulationData = {
  phishing: {
    stages: [
      {
        title: 'Hook the Attention',
        description:
          'A message claims there is a problem or urgent action needed, pushing you to click fast.',
        tactics: [
          { title: 'Urgency', detail: 'Creates panic or excitement so you act before verifying.' },
          { title: 'Brand impersonation', detail: 'Looks like a trusted company or recruiter.' },
        ],
        examples: [
          'Your account is on hold. Verify in 15 minutes to avoid suspension.',
          'Interview slot expiring. Confirm your details now.',
        ],
        conversation: [
          {
            role: 'recruiter',
            text: 'We need you to verify your details before the interview slot expires.',
          },
          { role: 'alex', text: 'Is this the official portal?' },
        ],
        options: [
          {
            label: 'Click and sign in quickly',
            commentary: 'Speed helps the scammer. This is how credentials get captured.',
            tags: ['Urgency', 'Impersonation'],
          },
          {
            label: 'Verify the sender first',
            commentary: 'Checking the sender is the safest first move.',
            tags: ['Verification'],
          },
        ],
      },
      {
        title: 'Credential Capture',
        description: 'A spoofed login page asks for passwords or one-time codes.',
        tactics: [
          { title: 'Pixel-perfect spoofing', detail: 'The page looks identical to a real login.' },
          { title: 'One-time code grab', detail: 'Asks for OTP to complete the takeover.' },
        ],
        examples: [
          'Enter your one-time code to finish the security review.',
          'Session expired. Sign in again to continue.',
        ],
        conversation: [
          {
            role: 'recruiter',
            text: 'Please re-enter the code we sent to complete your verification.',
          },
          { role: 'alex', text: 'I will do it now.' },
        ],
        options: [
          {
            label: 'Provide the one-time code',
            commentary: 'OTPs can be used immediately to seize your account.',
            tags: ['One-time code', 'Account takeover'],
          },
          {
            label: 'Stop and contact the real company',
            commentary: 'Direct contact breaks the scam flow.',
            tags: ['Break the flow'],
          },
        ],
      },
      {
        title: 'Account Takeover',
        description: 'Stolen credentials are used to access your account or message others.',
        tactics: [
          { title: 'Session hijack', detail: 'Uses tokens or cookies to bypass extra checks.' },
        ],
        examples: ['We updated your payroll account. Confirm in 24 hours.'],
        conversation: [
          { role: 'recruiter', text: 'We updated your profile with the info you submitted.' },
          { role: 'alex', text: 'I did not authorize this.' },
        ],
        options: [
          {
            label: 'Report the login attempt',
            commentary: 'Fast reporting limits damage.',
            tags: ['Containment'],
          },
          {
            label: 'Ignore it',
            commentary: 'Silence gives attackers time to pivot.',
            tags: ['Delay risk'],
          },
        ],
      },
    ],
    risks: [
      {
        title: 'Account takeover',
        detail: 'Access to email or job portals can be used to impersonate you.',
      },
      { title: 'Data reuse', detail: 'Stolen credentials are reused or sold across platforms.' },
    ],
    warnings: [
      {
        label: 'Unexpected messages with links or attachments',
        explain: 'Phishing emails often push you to click fast.',
      },
      {
        label: 'Requests to confirm personal or payment info',
        explain: 'Legit companies do not ask for this by link.',
      },
    ],
  },
  financial_fraud: {
    stages: [
      {
        title: 'Invoice Setup',
        description: 'A scammer claims there is a payment issue and sends a new account or check.',
        tactics: [
          { title: 'Payment pressure', detail: 'Claims delays will forfeit your spot or payment.' },
          { title: 'Channel switching', detail: 'Moves you away from official invoicing systems.' },
        ],
        examples: ['Finance updated our account details. Please pay the onboarding fee today.'],
        conversation: [
          {
            role: 'recruiter',
            text: 'Our finance team changed accounts. Please use the new details.',
          },
          { role: 'alex', text: 'Is there a receipt from HR?' },
        ],
        options: [
          {
            label: 'Pay the new invoice',
            commentary: 'Funds go directly to the scammer.',
            tags: ['Payment redirection'],
          },
          {
            label: 'Confirm with the company',
            commentary: 'Official channels can validate invoices.',
            tags: ['Verification'],
          },
        ],
      },
      {
        title: 'Escalation',
        description:
          'More fees appear quickly, or you are asked to send money back after a deposit.',
        tactics: [{ title: 'Sunk cost', detail: 'You feel committed after the first payment.' }],
        examples: ['Processing is delayed until the compliance deposit is received.'],
        conversation: [
          { role: 'recruiter', text: 'We need the compliance fee before release.' },
          { role: 'alex', text: 'This is unexpected.' },
        ],
        options: [
          {
            label: 'Pay to finish onboarding',
            commentary: 'Scammers repeat the fee cycle.',
            tags: ['Sunk cost'],
          },
          {
            label: 'Stop and document',
            commentary: 'Collect evidence and halt payment.',
            tags: ['Evidence'],
          },
        ],
      },
    ],
    risks: [
      {
        title: 'Direct financial loss',
        detail: 'Scammers ask you to pay or send back funds from fake checks.',
      },
      { title: 'Bank account exposure', detail: 'Bank details can be reused for other fraud.' },
    ],
    warnings: [
      {
        label: 'Asked to deposit a check and send money back',
        explain: 'Fake check scams rely on this loop.',
      },
      {
        label: 'Requests for gift cards, wire transfer, or crypto',
        explain: 'These are classic payment fraud signals.',
      },
    ],
  },
  task_based: {
    stages: [
      {
        title: 'Meet Alex',
        description:
          'Alex is a normal university student looking for flexible part-time income online.',
        illustration: '/icons/image1.png',
        illustrationAlt: 'Alex basic character setup',
        tactics: [
          {
            title: 'Relatability setup',
            detail: 'Scammers target ordinary people with realistic life situations.',
          },
        ],
        examples: [
          'You are just looking for side income and receive an unexpected “easy job” invitation.',
        ],
        conversation: [
          { role: 'recruiter', text: 'Hi Alex, we have flexible social-media tasks. Interested?' },
          { role: 'alex', text: 'Maybe. What does the work involve?' },
        ],
        options: [
          {
            label: 'Continue to check details first',
            commentary: 'Good start. Staying cautious early lowers risk.',
            tags: ['Baseline caution'],
          },
          {
            label: 'Trust quickly because it looks friendly',
            commentary: 'Emotional trust is often where manipulation begins.',
            tags: ['Trust trigger'],
          },
        ],
      },
      {
        title: 'Unexpected DM Job Invite',
        description:
          'A stranger sends Alex an Instagram DM offering social media “part-time tasks”.',
        illustration: '/icons/image2.png',
        illustrationAlt: 'Alex receives suspicious Instagram DM offer',
        tactics: [
          { title: 'Unsolicited contact', detail: 'No formal application process.' },
          { title: 'Platform shift', detail: 'Scammers may move chats to private apps.' },
        ],
        examples: ['“Easy online tasks, no experience, fast payout.”'],
        conversation: [
          { role: 'recruiter', text: 'Do simple social-media engagement tasks, paid daily.' },
          { role: 'alex', text: 'It sounds easy, but I should verify first.' },
        ],
        options: [
          {
            label: 'Ask for official business verification',
            commentary: 'Great move. Verification breaks many scam scripts.',
            tags: ['Verification'],
          },
          {
            label: 'Proceed because it seems harmless',
            commentary: 'Early compliance gives scammers momentum.',
            tags: ['Compliance'],
          },
        ],
      },
      {
        title: 'Small Wins Build Trust',
        description:
          'Alex completes a simple task and sees $240 in a dashboard, which feels exciting.',
        illustration: '/icons/image3.png',
        illustrationAlt: 'Alex sees task complete and fake balance growth',
        tactics: [
          { title: 'Fake balance', detail: 'Numbers on screen are used to simulate profit.' },
          { title: 'Reward loop', detail: 'Small wins increase emotional commitment.' },
        ],
        examples: ['“Task complete! Balance updated instantly.”'],
        conversation: [
          { role: 'recruiter', text: 'See? You already made money. Continue for bigger tasks.' },
          { role: 'alex', text: 'This looks profitable... maybe I should continue.' },
        ],
        options: [
          {
            label: 'Pause and test if withdrawal is real',
            commentary: 'Testing withdrawals early can expose the trap quickly.',
            tags: ['Reality check'],
          },
          {
            label: 'Keep going for bigger rewards',
            commentary: 'Greed pressure is a core escalation trigger.',
            tags: ['Escalation'],
          },
        ],
      },
      {
        title: 'Verification Fee Appears',
        description: 'To proceed, Alex is told to pay a $50 platform verification fee.',
        illustration: '/icons/image4.png',
        illustrationAlt: 'Alex sees request to pay verification fee',
        tactics: [
          { title: 'Fee injection', detail: 'A surprise fee is inserted after trust is built.' },
          {
            title: 'Sunk-cost pressure',
            detail: 'Because you already invested time, paying feels easier.',
          },
        ],
        examples: ['“Pay a small verification amount to unlock full withdrawals.”'],
        conversation: [
          { role: 'recruiter', text: 'Just a small verification fee. Everyone pays it once.' },
          { role: 'alex', text: 'Why should I pay to access my own earnings?' },
        ],
        options: [
          {
            label: 'Refuse payment and ask for official policy',
            commentary: 'Legitimate employers do not charge onboarding fees like this.',
            tags: ['Policy check'],
          },
          {
            label: 'Pay quickly to avoid delay',
            commentary: 'This usually opens the next demand, not a real withdrawal.',
            tags: ['Fee trap'],
          },
        ],
      },
      {
        title: 'Threat Escalation',
        description:
          'Alex receives “Legal Department / FINAL WARNING” messages demanding ID details.',
        illustration: '/icons/image5.png',
        illustrationAlt: 'Alex receives legal threat and identity pressure',
        tactics: [
          { title: 'Fear tactic', detail: 'Legal threats force rushed, emotional decisions.' },
          {
            title: 'Identity harvesting',
            detail: 'Pressure is used to extract personal information.',
          },
        ],
        examples: ['“FINAL WARNING: submit your identity details immediately.”'],
        conversation: [
          {
            role: 'recruiter',
            text: 'Our legal team will proceed unless you send your details now.',
          },
          { role: 'alex', text: 'This is threatening. I should stop and report.' },
        ],
        options: [
          {
            label: 'Stop and preserve evidence',
            commentary: 'Correct action. Save messages, report, and avoid further disclosure.',
            tags: ['Evidence', 'Report'],
          },
          {
            label: 'Submit details to calm the threat',
            commentary: 'Identity disclosure can create long-term fraud risk.',
            tags: ['Identity risk'],
          },
        ],
      },
      {
        title: 'Pattern Reveal',
        description:
          'Future Alex explains the two core scam mechanics: fake balance and pressure tactic.',
        illustration: '',
        illustrationAlt: 'Alex highlights fake balance and pressure tactics',
        tactics: [
          {
            title: 'Fake balance',
            detail: 'Displayed earnings are not proof of real, withdrawable funds.',
          },
          {
            title: 'Pressure tactic',
            detail: 'Threats and urgency are used to bypass critical thinking.',
          },
        ],
        examples: [
          '“You have funds, but must pay first.”',
          '“Act now or face legal consequences.”',
        ],
        conversation: [
          {
            role: 'alex',
            text: 'Now I can clearly see both the fake balance and pressure pattern.',
          },
          { role: 'recruiter', text: 'Last chance. Send payment and identity now.' },
        ],
        options: [
          {
            label: 'Label the tactic and disengage',
            commentary: 'Naming the manipulation helps you regain control.',
            tags: ['Pattern recognition'],
          },
          {
            label: 'Keep negotiating with scammer',
            commentary: 'Further engagement usually increases exposure and stress.',
            tags: ['Prolonged exposure'],
          },
        ],
      },
      {
        title: 'Regain Control',
        description: 'Alex ends safely and confidently after recognizing the scam structure.',
        illustration: '',
        illustrationAlt: 'Alex celebrates regaining control after scam recognition',
        tactics: [
          {
            title: 'Recovery mindset',
            detail: 'Stopping early and reporting is a successful outcome.',
          },
        ],
        examples: ['“You’ve got this.”'],
        conversation: [
          { role: 'alex', text: 'I blocked the contact, saved evidence, and reported it.' },
          { role: 'recruiter', text: '...' },
        ],
        options: [
          {
            label: 'Complete walkthrough and record what you learned',
            commentary: 'Excellent finish. Confidence plus process beats scam pressure.',
            tags: ['Confidence', 'Safety habit'],
          },
          {
            label: 'Ignore and move on without reflection',
            commentary: 'Reflection helps you recognize similar scripts faster next time.',
            tags: ['Learning opportunity'],
          },
        ],
      },
    ],
    risks: [
      { title: 'Repeated deposits', detail: 'Scammers chain deposits until you stop.' },
      { title: 'Crypto losses', detail: 'Crypto payments are hard to reverse once sent.' },
    ],
    warnings: [
      {
        label: 'Contacted on WhatsApp or Telegram',
        explain: 'Task-based scams often move to encrypted apps.',
      },
      {
        label: 'Asked to top up or buy crypto to unlock tasks',
        explain: 'This is a key warning sign in task scams.',
      },
      {
        label: 'High pay for little effort',
        explain: 'Too-good-to-be-true job offers are common.',
      },
    ],
  },
  identity_scam: {
    stages: [
      {
        title: 'Document Request',
        description: 'The scammer asks for ID or personal data to continue the process.',
        tactics: [
          { title: 'False verification', detail: 'Claims ID is needed to proceed quickly.' },
        ],
        examples: ['Please send your passport and driver license to finalize your contract.'],
        conversation: [
          { role: 'recruiter', text: 'We need your ID for compliance.' },
          { role: 'alex', text: 'Is there a secure portal?' },
        ],
        options: [
          {
            label: 'Send ID over chat',
            commentary: 'That ID can be reused for fraud.',
            tags: ['Document harvest'],
          },
          {
            label: 'Ask for secure upload',
            commentary: 'Secure upload helps reduce risk.',
            tags: ['Secure process'],
          },
        ],
      },
      {
        title: 'Profile Build',
        description: 'Stolen data is used to open accounts or impersonate you.',
        tactics: [{ title: 'Layered data capture', detail: 'Asks for more documents over time.' }],
        examples: ['Please confirm your address and bank details for verification.'],
        conversation: [
          { role: 'recruiter', text: 'We need your bank account for payroll setup.' },
          { role: 'alex', text: 'I can provide it after offer letter.' },
        ],
        options: [
          {
            label: 'Provide more details',
            commentary: 'Each detail adds to the fraud profile.',
            tags: ['Data layering'],
          },
          {
            label: 'Pause and verify',
            commentary: 'Verification slows misuse.',
            tags: ['Verification'],
          },
        ],
      },
    ],
    risks: [
      {
        title: 'Identity theft',
        detail: 'Personal information is used to open accounts or get credit.',
      },
      { title: 'Long-term impact', detail: 'Cleaning up identity fraud can take months.' },
    ],
    warnings: [
      {
        label: 'Requests for personal information via email/text',
        explain: 'Scammers try to steal data this way.',
      },
      {
        label: 'Unexpected new bills or account activity',
        explain: 'These can signal identity theft.',
      },
    ],
  },
  investment: {
    stages: [
      {
        title: 'Promise of Returns',
        description: 'A recruiter pitches a high-return investment or side income.',
        tactics: [{ title: 'Guaranteed returns', detail: 'Promises that remove perceived risk.' }],
        examples: ['Earn 25% weekly by joining our private trading pool.'],
        conversation: [
          { role: 'recruiter', text: 'Invest now and we guarantee 25% weekly.' },
          { role: 'alex', text: 'That is unusually high.' },
        ],
        options: [
          {
            label: 'Transfer funds to start',
            commentary: 'High returns are a classic lure.',
            tags: ['Guaranteed returns'],
          },
          {
            label: 'Ask for licensing',
            commentary: 'Legitimate investments disclose licenses.',
            tags: ['Verify credentials'],
          },
        ],
      },
      {
        title: 'Fake Portfolio',
        description: 'A dashboard shows growth to lure more deposits.',
        tactics: [{ title: 'Fake gains', detail: 'Shows growth that does not exist.' }],
        examples: ['Your portfolio is up 40% today. Add more to maximize profit.'],
        conversation: [
          { role: 'recruiter', text: 'Your profits are ready, just add more to unlock.' },
          { role: 'alex', text: 'Why do I need to add more?' },
        ],
        options: [
          {
            label: 'Add more capital',
            commentary: 'Scammers keep asking for more funds.',
            tags: ['Escalation'],
          },
          {
            label: 'Request withdrawal',
            commentary: 'Withdrawal tests the legitimacy.',
            tags: ['Withdrawal test'],
          },
        ],
      },
      {
        title: 'Locked Withdrawal',
        description: 'Fees, taxes, or deposits appear to release your funds.',
        tactics: [{ title: 'Fee trap', detail: 'Invents a fee that never ends.' }],
        examples: ['Pay the tax fee today to withdraw your earnings.'],
        conversation: [
          { role: 'recruiter', text: 'We need the tax fee to release funds.' },
          { role: 'alex', text: 'Why is there a fee to withdraw my own money?' },
        ],
        options: [
          {
            label: 'Pay the tax fee',
            commentary: 'Payments keep escalating.',
            tags: ['Fee trap'],
          },
          {
            label: 'Stop and report',
            commentary: 'Reporting can limit further loss.',
            tags: ['Report'],
          },
        ],
      },
    ],
    risks: [
      { title: 'Large financial loss', detail: 'Deposits are unrecoverable once sent.' },
      { title: 'Continued targeting', detail: 'Scammers re-contact with new offers.' },
    ],
    warnings: [
      {
        label: 'High pressure to act fast',
        explain: 'Scamwatch notes pressure tactics are common.',
      },
      {
        label: 'Promises of big returns',
        explain: 'Over-the-top profit claims are a warning sign.',
      },
    ],
  },
}

export function normalizeScamType(input) {
  if (!input) return null
  const key = input.toString().toLowerCase()
  if (key.includes('phish')) return 'phishing'
  if (key.includes('financial')) return 'financial_fraud'
  if (key.includes('task')) return 'task_based'
  if (key.includes('identity')) return 'identity_scam'
  if (key.includes('invest')) return 'investment'
  return null
}
