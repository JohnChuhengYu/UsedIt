export interface PresetWord {
  text: string;
  definition: string;
  example: string;
  phonetic?: string;
  part_of_speech?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface PresetDeck {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  description: string;
  words: PresetWord[];
}

export const PRESET_DECKS: PresetDeck[] = [
  {
    id: 'ielts-toefl-speaking',
    title: 'IELTS & TOEFL High-Yield',
    subtitle: 'High-Scoring Academic & Speaking Fluency',
    badge: 'Exam Prep',
    icon: '🎓',
    description: 'Sophisticated yet natural transition words and vivid verbs that immediately lift lexical resource scores in speaking and writing.',
    words: [
      {
        text: 'articulate',
        definition: 'Expressing ideas clearly, coherently, and effectively in speech or writing.',
        example: 'She gave an articulate defense of her research methodology during the seminar.',
        phonetic: '/ɑːrˈtɪkjuleɪt/',
        part_of_speech: 'adjective',
        difficulty: 'Medium'
      },
      {
        text: 'nuanced',
        definition: 'Characterized by subtle shades of distinction or variation in meaning, tone, or perspective.',
        example: 'The documentary provides a nuanced look at the socio-economic impacts of urbanization.',
        phonetic: '/ˈnjuːɑːnst/',
        part_of_speech: 'adjective',
        difficulty: 'Medium'
      },
      {
        text: 'compelling',
        definition: 'Evoking overwhelming interest, conviction, or admiration in an irresistible way.',
        example: 'The speaker presented a compelling argument that convinced even the strictest skeptics.',
        phonetic: '/kəmˈpelɪŋ/',
        part_of_speech: 'adjective',
        difficulty: 'Easy'
      },
      {
        text: 'substantiate',
        definition: 'To provide solid evidence or proof to corroborate the truth of a claim.',
        example: 'You must substantiate your assertions with reliable empirical data.',
        phonetic: '/səbˈstænʃieɪt/',
        part_of_speech: 'verb',
        difficulty: 'Hard'
      },
      {
        text: 'unprecedented',
        definition: 'Never having occurred, existed, or experienced before; unparalleled.',
        example: 'The pandemic brought an unprecedented wave of challenges to global healthcare systems.',
        phonetic: '/ʌnˈpresɪdentɪd/',
        part_of_speech: 'adjective',
        difficulty: 'Medium'
      },
      {
        text: 'paradoxically',
        definition: 'In a manner that appears self-contradictory yet expresses a deeper truth.',
        example: 'Paradoxically, taking regular breaks can significantly boost overall productivity.',
        phonetic: '/ˌpærəˈdɒksɪkli/',
        part_of_speech: 'adverb',
        difficulty: 'Hard'
      },
      {
        text: 'inadvertently',
        definition: 'Without intentional forethought; accidentally or unwittingly.',
        example: 'He inadvertently deleted the essential folder while cleaning up his hard drive.',
        phonetic: '/ˌɪnədˈvɜːtəntli/',
        part_of_speech: 'adverb',
        difficulty: 'Medium'
      },
      {
        text: 'viable',
        definition: 'Capable of working successfully, surviving, or sustaining long-term feasibility.',
        example: 'Renewable solar energy has become an economically viable alternative to fossil fuels.',
        phonetic: '/ˈvaɪəbl/',
        part_of_speech: 'adjective',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'business-workplace',
    title: 'Business & Workplace Fluency',
    subtitle: 'Executive Communication & Strategy',
    badge: 'Career',
    icon: '💼',
    description: 'Precision vocabulary for standups, investor pitches, performance reviews, and cross-functional alignment.',
    words: [
      {
        text: 'streamline',
        definition: 'To make an organization, workflow, or system more efficient and faster by simplifying steps.',
        example: 'We overhauled our deployment pipeline to streamline the entire release cycle.',
        phonetic: '/ˈstriːmlaɪn/',
        part_of_speech: 'verb',
        difficulty: 'Medium'
      },
      {
        text: 'leverage',
        definition: 'To utilize an existing asset, skill, or opportunity to its maximum strategic advantage.',
        example: 'The startup leveraged user-generated feedback to outmaneuver legacy competitors.',
        phonetic: '/ˈliːvərɪdʒ/',
        part_of_speech: 'verb',
        difficulty: 'Medium'
      },
      {
        text: 'bandwidth',
        definition: 'The mental energy, time, or operational capacity required to take on additional tasks.',
        example: 'I would love to help with the design review, but I currently lack the bandwidth this quarter.',
        phonetic: '/ˈbændwɪdθ/',
        part_of_speech: 'noun',
        difficulty: 'Easy'
      },
      {
        text: 'mitigate',
        definition: 'To make something bad, risky, or painful less severe, hazardous, or intense.',
        example: 'We implemented redundant backups to mitigate the risk of server downtime.',
        phonetic: '/ˈmɪtɪɡeɪt/',
        part_of_speech: 'verb',
        difficulty: 'Hard'
      },
      {
        text: 'pragmatic',
        definition: 'Guided by practical and realistic considerations rather than rigid theoretical rules.',
        example: 'She adopted a pragmatic roadmap that prioritized essential features over perfection.',
        phonetic: '/præɡˈmætɪk/',
        part_of_speech: 'adjective',
        difficulty: 'Medium'
      },
      {
        text: 'friction',
        definition: 'Resistance, bottlenecks, or interpersonal disagreement that slows down execution.',
        example: 'Simplifying the signup form reduced onboarding friction by forty percent.',
        phonetic: '/ˈfrɪkʃn/',
        part_of_speech: 'noun',
        difficulty: 'Easy'
      },
      {
        text: 'align',
        definition: 'To bring diverse perspectives, teams, or goals into complete agreement and coordination.',
        example: 'Let us schedule a quick sync to ensure the product and marketing teams align on launch goals.',
        phonetic: '/əˈlaɪn/',
        part_of_speech: 'verb',
        difficulty: 'Easy'
      },
      {
        text: 'iterate',
        definition: 'To perform rapid, repeated cycles of refinement and adjustment to incrementally improve an outcome.',
        example: 'Our team will ship an early prototype and iterate rapidly based on user analytics.',
        phonetic: '/ˈɪtəreɪt/',
        part_of_speech: 'verb',
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'gre-academic',
    title: 'GRE & Academic Distinction',
    subtitle: 'Nuanced Reasoning & Critical Discourse',
    badge: 'Scholarly',
    icon: '📚',
    description: 'High-frequency analytical words that express subtle dualities, epistemological contrasts, and critical rigor.',
    words: [
      {
        text: 'ephemeral',
        definition: 'Lasting for a remarkably brief or fleeting period; transitory.',
        example: 'Fame in the social media era is notoriously ephemeral.',
        phonetic: '/ɪˈfemərəl/',
        part_of_speech: 'adjective',
        difficulty: 'Hard'
      },
      {
        text: 'ubiquitous',
        definition: 'Existing, encountered, or present everywhere simultaneously.',
        example: 'Smartphones have become an ubiquitous fixture of modern urban existence.',
        phonetic: '/juːˈbɪkwɪtəs/',
        part_of_speech: 'adjective',
        difficulty: 'Hard'
      },
      {
        text: 'juxtapose',
        definition: 'To place distinct entities or images side-by-side to illuminate contrasting attributes.',
        example: 'The curator juxtaposed classical Renaissance portraits with modern abstract sculptures.',
        phonetic: '/ˌdʒʌkstəˈpəʊz/',
        part_of_speech: 'verb',
        difficulty: 'Hard'
      },
      {
        text: 'equivocal',
        definition: 'Subject to more than one interpretation; ambiguous or inconclusive.',
        example: 'The committee received an equivocal response that answered none of the underlying dilemmas.',
        phonetic: '/ɪˈkwɪvəkl/',
        part_of_speech: 'adjective',
        difficulty: 'Hard'
      },
      {
        text: 'innocuous',
        definition: 'Producing no injury or harm; entirely safe or non-threatening.',
        example: 'What appeared to be an innocuous clerical error actually caused widespread database disruption.',
        phonetic: '/ɪˈnɒkjuəs/',
        part_of_speech: 'adjective',
        difficulty: 'Hard'
      },
      {
        text: 'dichotomy',
        definition: 'A division or sharp contrast between two mutually exclusive or contradictory entities.',
        example: 'Philosophers often debate the traditional dichotomy between nature and nurture.',
        phonetic: '/daɪˈkɒtəmi/',
        part_of_speech: 'noun',
        difficulty: 'Hard'
      },
      {
        text: 'pervasive',
        definition: 'Spreading broadly throughout all parts of an environment, mindset, or culture.',
        example: 'There was a pervasive sense of skepticism regarding the announced corporate restructuring.',
        phonetic: '/pəˈveɪsɪv/',
        part_of_speech: 'adjective',
        difficulty: 'Medium'
      },
      {
        text: 'paradigm',
        definition: 'A typical example, conceptual archetype, or foundational pattern of ideas.',
        example: 'The discovery triggered a paradigm shift in how evolutionary biologists interpret genetic drift.',
        phonetic: '/ˈpærədaɪm/',
        part_of_speech: 'noun',
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'native-expressions',
    title: 'Everyday Native Expressions',
    subtitle: 'Idiomatic Nuance & Spoken Charisma',
    badge: 'Colloquial',
    icon: '🌟',
    description: 'Idiomatic, culturally rich vocabulary and phrases that transform textbook English into lively, effortless speech.',
    words: [
      {
        text: 'serendipity',
        definition: 'The faculty of making fortunate and unexpected discoveries purely by happy accident.',
        example: 'Running into an old mentor at the airport was pure serendipity.',
        phonetic: '/ˌserənˈdɪpəti/',
        part_of_speech: 'noun',
        difficulty: 'Medium'
      },
      {
        text: 'hindsight',
        definition: 'The comprehensive understanding of an event or decision only after it has already occurred.',
        example: 'In hindsight, accepting that remote engineering position was the finest decision I ever made.',
        phonetic: '/ˈhaɪndsaɪt/',
        part_of_speech: 'noun',
        difficulty: 'Medium'
      },
      {
        text: 'second-guess',
        definition: 'To doubt, re-evaluate, or criticize a choice or judgment after it has been finalized.',
        example: 'Stop second-guessing your instincts; trust the detailed preparation you put into this.',
        phonetic: '/ˌsekəndˈɡes/',
        part_of_speech: 'verb',
        difficulty: 'Easy'
      },
      {
        text: 'gut feeling',
        definition: 'An immediate visceral instinct or intuition rather than a conclusion derived from analytical logic.',
        example: 'My gut feeling told me something was off with the contract before the lawyer even flagged it.',
        phonetic: '/ɡʌt ˈfiːlɪŋ/',
        part_of_speech: 'noun',
        difficulty: 'Easy'
      },
      {
        text: 'spot on',
        definition: 'Completely accurate, precise, and without any flaw or error.',
        example: 'Your assessment of market sentiment turned out to be spot on.',
        phonetic: '/spɒt ɒn/',
        part_of_speech: 'adjective',
        difficulty: 'Easy'
      },
      {
        text: 'off the cuff',
        definition: 'Spoken spontaneously without prior rehearsal, scripted notes, or premeditation.',
        example: 'His off the cuff remarks at the dinner were much warmer and funnier than his prepared keynote.',
        phonetic: '/ɒf ðə kʌf/',
        part_of_speech: 'adverb',
        difficulty: 'Medium'
      },
      {
        text: 'cut corners',
        definition: 'To do something in the cheapest, quickest, or easiest way while sacrificing standards or safety.',
        example: 'The contractor cut corners on insulation, resulting in high heating bills in winter.',
        phonetic: '/kʌt ˈkɔːnəz/',
        part_of_speech: 'idiom',
        difficulty: 'Easy'
      },
      {
        text: 'call it a day',
        definition: 'To conclude the day’s work or temporarily cease an activity after substantial effort.',
        example: 'We have made tremendous progress debugging the issue; let us call it a day and recharge.',
        phonetic: '/kɔːl ɪt ə deɪ/',
        part_of_speech: 'idiom',
        difficulty: 'Easy'
      }
    ]
  }
];
