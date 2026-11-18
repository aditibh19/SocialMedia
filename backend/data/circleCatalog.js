// Curated starter content for Circle Switch. Review content regularly before public release.
// Only the server holds correctIndex and explanations until a user submits an answer.
const lessons = [
  {
    id: 'upi-refund', category: 'Money & safety', minutes: 2,
    title: 'Receive a UPI refund safely',
    intro: 'A stranger messages: “Scan this QR and enter your PIN to receive a refund.”',
    takeaway: 'Receiving a UPI payment does not require entering your UPI PIN or scanning a payment QR code. Check the transaction in your own bank/UPI app.',
    question: 'What is the safest next step?',
    options: ['Scan the code immediately', 'Verify independently in your official bank or UPI app', 'Share your UPI PIN with the sender'],
    correctIndex: 1,
    explanation: 'Never enter your UPI PIN to receive money. Contact the provider through an official channel instead of trusting the message.'
  },
  {
    id: 'salary-breakdown', category: 'Career', minutes: 2,
    title: 'CTC is not in-hand salary',
    intro: 'An offer letter says ₹8 lakh CTC. Does that mean ₹66,667 enters your bank every month?',
    takeaway: 'CTC can include employer contributions and benefits. Take-home pay also depends on deductions and taxes.',
    question: 'Which figure best represents money deposited into your bank?',
    options: ['Annual CTC / 12', 'Gross pay without deductions', 'Net pay after applicable deductions'],
    correctIndex: 2,
    explanation: 'In-hand pay is the net amount after applicable deductions. Ask for a clear salary-component breakdown.'
  },
  {
    id: 'phishing-link', category: 'Digital life', minutes: 2,
    title: 'Spot a suspicious login link',
    intro: 'You receive a “Your account will close in 10 minutes” email asking you to log in through a link.',
    takeaway: 'Urgency is a common phishing tactic. Navigate to the service using your own bookmark or official app.',
    question: 'What should you do first?',
    options: ['Click the email link', 'Forward your password to support', 'Open the official app or type its known URL yourself'],
    correctIndex: 2,
    explanation: 'Do not enter credentials on links from unexpected messages. Use official channels to verify the alert.'
  },
  {
    id: 'feedback', category: 'Communication', minutes: 2,
    title: 'Give better feedback',
    intro: 'A teammate misses a deadline. You need to discuss the issue without starting an argument.',
    takeaway: 'Describe the observable issue, explain its impact, and ask about a practical next step.',
    question: 'Which response is most constructive?',
    options: ['“You are always irresponsible.”', '“The handoff was late, which delayed testing. What can we change next time?”', 'Complain about them to the whole group'],
    correctIndex: 1,
    explanation: 'Specific, respectful feedback focuses on behavior, impact and next steps rather than attacking the person.'
  },
  {
    id: 'privacy-settings', category: 'Digital life', minutes: 2,
    title: 'Review your digital footprint',
    intro: 'A new app asks for your location, contacts, microphone and photos before you can use its main feature.',
    takeaway: 'Grant only the permissions needed for the feature you choose. Check whether access can be limited to “while using the app.”',
    question: 'What is a sensible privacy choice?',
    options: ['Allow every permission forever', 'Review each request and deny unnecessary access', 'Share your login with friends'],
    correctIndex: 1,
    explanation: 'Review why access is needed and choose the narrowest practical permission.'
  }
];

const games = [
  {
    id: 'spot-the-scam', title: 'Spot the Scam', category: 'Money & digital safety', minutes: 3,
    description: 'Five quick real-life situations. Can you spot the red flags?',
    questions: [
      {id:'s1',prompt:'Someone promises a refund but asks you to enter a UPI PIN.',options:['Enter the PIN','Decline and verify in the official app','Send a screenshot of your PIN'],correctIndex:1,explanation:'A UPI PIN is used to authorize payments, not to receive money.'},
      {id:'s2',prompt:'A fake-sounding recruiter asks you to pay a “joining fee.”',options:['Verify through the company’s official hiring channel','Pay quickly to secure the offer','Share your bank password'],correctIndex:0,explanation:'Verify recruiters independently. Legitimate offers should not require paying a fee for a job.'},
      {id:'s3',prompt:'A friend sends an unexpected APK file with “install this now.”',options:['Install immediately','Forward it to others','Ask why, and use a trusted app store instead'],correctIndex:2,explanation:'Unverified installation files can be dangerous even when sent from familiar contacts.'},
      {id:'s4',prompt:'You get a one-time password you did not request.',options:['Share it with someone claiming to be support','Do not share it and check account security','Post it on social media'],correctIndex:1,explanation:'An OTP is a secret. Unexpected codes can signal someone attempting to sign in.'},
      {id:'s5',prompt:'A shopping website has an unbelievably low price and demands an instant bank transfer.',options:['Verify its reputation and use safer payment options','Transfer money immediately','Send them your ID photo'],correctIndex:0,explanation:'Unusually low prices and irreversible payment requests are warning signs.'}
    ]
  },
  {
    id:'everyday-decisions', title:'Everyday Decisions',category:'Practical life',minutes:3,
    description:'Choose your move in five situations that matter outside the feed.',
    questions:[
      {id:'d1',prompt:'You do not understand a term in an offer letter.',options:['Sign without asking','Ask HR to explain the term in writing','Ask the internet to sign it for you'],correctIndex:1,explanation:'Getting a clear written explanation helps you understand what you are accepting.'},
      {id:'d2',prompt:'A friend shares your picture publicly without asking.',options:['Explain your boundaries and ask them to remove it','Publish their private photos in response','Ignore your discomfort forever'],correctIndex:0,explanation:'Setting clear boundaries is reasonable; respect should go both ways.'},
      {id:'d3',prompt:'You feel overwhelmed by notifications while studying.',options:['Enable every alert','Keep checking every 30 seconds','Silence nonessential notifications for a focus period'],correctIndex:2,explanation:'Intentional notification settings can help you focus on what you choose.'},
      {id:'d4',prompt:'You see a viral claim about a university exam being cancelled.',options:['Share immediately','Check your university’s official notice','Assume any screenshot is real'],correctIndex:1,explanation:'Important updates are worth confirming from an authoritative source.'},
      {id:'d5',prompt:'A classmate disagrees with your idea in a group project.',options:['Listen and compare the reasons','Insult them','Leave the group'],correctIndex:0,explanation:'Respectful disagreement often produces a stronger solution.'}
    ]
  }
];

const quests = [
  {id:'three-photos',mode:'create',title:'Tell a story in 3 photos',minutes:10,description:'Take a beginning, middle and ending photo from your day. Share only if you feel like it.',prompt:'My 3-photo story today: '},
  {id:'tiny-creation',mode:'create',title:'Make something small',minutes:15,description:'Sketch a doodle, write four lines, make a tiny design or build a tiny script.',prompt:'Today I made something small: '},
  {id:'desk-reset',mode:'create',title:'5-minute desk reset',minutes:5,description:'Put your phone down and tidy one little workspace area. No proof required.',prompt:'My mini desk reset: '},
  {id:'offline-photo',mode:'create',title:'Notice one beautiful detail',minutes:10,description:'Take a short walk and find one interesting shadow, texture or color.',prompt:'A detail I noticed today: '},
  {id:'check-in',mode:'connect',title:'Check in with a friend',minutes:5,description:'Send a genuine “How have you been?” message. Listen without multitasking.',prompt:'A conversation I appreciated today: '},
  {id:'thank-someone',mode:'connect',title:'Say thank you',minutes:3,description:'Thank someone for a specific thing they did for you. Private thanks count too.',prompt:'Someone I appreciate today: '},
  {id:'share-a-tip',mode:'connect',title:'Teach one tiny thing',minutes:5,description:'Share a genuinely helpful tip with someone who wants to learn it.',prompt:'A useful thing I shared: '},
  {id:'plan-together',mode:'connect',title:'Plan an offline activity',minutes:10,description:'Plan a low-pressure, enjoyable activity with a friend. Respect their availability.',prompt:'One thing I would love to do with friends: '}
];

function publicCatalog() {
  return {
    lessons: lessons.map(({correctIndex, explanation, ...l})=>l),
    games: games.map(({questions,...g})=>({...g, questions:questions.map(({correctIndex,explanation,...q})=>q)})),
    quests
  };
}

function gradeGame(game,answers){
  if(!game || !Array.isArray(answers) || answers.length!==game.questions.length || !answers.every((x,i)=>Number.isInteger(x) && x>=0 && x<game.questions[i].options.length)) return null;
  const details=game.questions.map((question,index)=>({id:question.id,chosenIndex:answers[index],correctIndex:question.correctIndex,correct:answers[index]===question.correctIndex,explanation:question.explanation}));
  return {score:details.filter(x=>x.correct).length,total:details.length,details};
}

module.exports={lessons,games,quests,publicCatalog,gradeGame};
