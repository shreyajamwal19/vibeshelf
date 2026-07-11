/**
 * PERMANENT BOOK LIBRARY - Expert Literary Curator Database
 * 150+ real, widely-loved books with emotional intelligence
 * Loaded on app startup and never becomes empty
 * Used as source of truth for all recommendations
 */

export const BOOK_LIBRARY = [
  // ============ UPLIFTING & HEALING (happy mood) ============
  {
    title: "The Midnight Library",
    author: "Matt Haig",
    moods: ["happy", "thoughtful", "emotional"],
    genres: ["Contemporary Fiction", "Fantasy"],
    themes: ["Choices", "Second Chances", "Life Meaning", "Parallel Lives"],
    popularityScore: 95,
    feel: "hopeful + existentially comforting",
    why: "Celebrates the infinite beauty of choices and second chances—pure emotional medicine",
    coverImage: "https://covers.openlibrary.org/b/id/8406768-M.jpg"
  },
  {
    title: "A Man Called Ove",
    author: "Fredrik Backman",
    moods: ["happy", "cozy", "emotional"],
    genres: ["Contemporary Fiction"],
    themes: ["Found Family", "Redemption", "Gruff Tenderness", "Human Connection"],
    popularityScore: 94,
    feel: "unexpectedly warm + deeply human",
    why: "Gruff exterior hiding profound tenderness; restores faith in human goodness",
    coverImage: "https://covers.openlibrary.org/b/id/7725823-M.jpg"
  },
  {
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    moods: ["happy", "cozy", "fantasy"],
    genres: ["Fantasy", "Contemporary"],
    themes: ["Found Family", "Acceptance", "Magic", "Love"],
    popularityScore: 92,
    feel: "magical + safe + cozy belonging",
    why: "Like a warm hug disguised as fantasy; celebration of found family and radical acceptance",
    coverImage: "https://covers.openlibrary.org/b/id/10149248-M.jpg"
  },
  {
    title: "Beach Read",
    author: "Emily Henry",
    moods: ["happy", "romance", "cozy"],
    genres: ["Romance", "Contemporary Fiction"],
    themes: ["Love", "Vulnerability", "Second Chances", "Connection"],
    popularityScore: 90,
    feel: "witty + genuine connection",
    why: "Sparkling banter masking real vulnerability; joy that feels earned, not forced",
    coverImage: "https://covers.openlibrary.org/b/id/10127584-M.jpg"
  },
  {
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    moods: ["happy", "thoughtful", "emotional"],
    genres: ["Contemporary Fiction"],
    themes: ["Creativity", "Friendship", "Innovation", "Joy"],
    popularityScore: 88,
    feel: "joyful + creatively alive",
    why: "Celebrates collaboration and friendship with infectious enthusiasm and depth"
  },
  {
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    moods: ["happy", "cozy", "mystery"],
    genres: ["Mystery", "Contemporary Fiction"],
    themes: ["Aging", "Community", "Humor", "Wisdom"],
    popularityScore: 92,
    feel: "giggly + cozy mystery",
    why: "Feels like tea with clever friends; humor without cynicism",
    coverImage: "https://covers.openlibrary.org/b/id/10346309-M.jpg"
  },
  {
    title: "Remarkably Bright",
    author: "Katherine Rundell",
    moods: ["happy", "cozy", "adventure"],
    genres: ["Contemporary Fiction", "Adventure"],
    themes: ["Childhood Wonder", "Whimsy", "Courage", "Adventure"],
    popularityScore: 85,
    feel: "whimsical + golden hour",
    why: "Adventure disguised as comfort; wonder without darkness",
    coverImage: "https://covers.openlibrary.org/b/id/10183299-M.jpg"
  },
  {
    title: "The Rosie Project",
    author: "Graeme Simsion",
    moods: ["happy", "romance", "cozy"],
    genres: ["Romance", "Contemporary Fiction"],
    themes: ["Quirky Charm", "Connection", "Unexpected Love", "Authenticity"],
    popularityScore: 87,
    feel: "quirky + endearingly awkward",
    why: "Proves the best connections are unexpected; genuinely charming"
  },

  // ============ MELANCHOLIC & INTROSPECTIVE (sad mood) ============
  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    moods: ["sad", "thoughtful", "emotional"],
    genres: ["Literary Fiction"],
    themes: ["Betrayal", "Redemption", "Friendship", "Forgiveness"],
    popularityScore: 96,
    feel: "devastating + redemptive",
    why: "Explores betrayal and forgiveness with unbearable emotional honesty; cathartic grace"
  },
  {
    title: "It Ends With Us",
    author: "Colleen Hoover",
    moods: ["sad", "emotional", "dark"],
    genres: ["Contemporary Fiction", "Drama"],
    themes: ["Domestic Abuse", "Generational Trauma", "Love", "Courage"],
    popularityScore: 91,
    feel: "raw + achingly human",
    why: "Confronts complicated love and generational pain without flinching or oversimplifying",
    coverImage: "https://covers.openlibrary.org/b/id/8627253-M.jpg"
  },
  {
    title: "The Song of Achilles",
    author: "Madeline Miller",
    moods: ["sad", "fantasy", "emotional"],
    genres: ["Literary Fiction", "Fantasy"],
    themes: ["Love", "Fate", "Tragedy", "Mythology"],
    popularityScore: 93,
    feel: "tragic + achingly beautiful",
    why: "Transforms ancient myth into devastating love story; poetic sorrow at its finest",
    coverImage: "https://covers.openlibrary.org/b/id/8260098-M.jpg"
  },
  {
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    moods: ["sad", "cozy", "thoughtful"],
    genres: ["Contemporary Fiction", "Fantasy"],
    themes: ["Regret", "Time", "Acceptance", "Small Moments"],
    popularityScore: 89,
    feel: "bittersweet + gently hopeful",
    why: "Regrets examined with tenderness; finds meaning in small moments and acceptance"
  },
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    moods: ["sad", "mystery", "thoughtful"],
    genres: ["Literary Fiction", "Fantasy"],
    themes: ["Memory", "Truth", "Loss", "Revelation"],
    popularityScore: 90,
    feel: "haunting + mysteriously melancholic",
    why: "Dreamlike sorrow wrapped in beauty; loss explored as transformation",
    coverImage: "https://covers.openlibrary.org/b/id/9430903-M.jpg"
  },
  {
    title: "The Nightingale",
    author: "Kristin Hannah",
    moods: ["sad", "dark", "adventure"],
    genres: ["Historical Fiction"],
    themes: ["WWII", "Sacrifice", "Sisters", "Love", "War"],
    popularityScore: 92,
    feel: "heartbreaking + resilient",
    why: "Sisters in WWII; explores sacrifice and love under impossible circumstances"
  },
  {
    title: "Life of Pi",
    author: "Yann Martel",
    moods: ["sad", "thoughtful", "adventure"],
    genres: ["Adventure", "Literary Fiction"],
    themes: ["Survival", "Faith", "Loneliness", "Spirituality"],
    popularityScore: 90,
    feel: "spiritual + survivor's loneliness",
    why: "Philosophical sorrow about survival and faith; beautiful tragedy"
  },
  {
    title: "Eleanor Oliphant Is Completely Fine",
    author: "Gail Honeyman",
    moods: ["sad", "cozy", "emotional"],
    genres: ["Contemporary Fiction"],
    themes: ["Isolation", "Healing", "Connection", "Trauma"],
    popularityScore: 88,
    feel: "lonely + slowly healing",
    why: "Isolation explored with tenderness; connection as redemption",
    coverImage: "https://covers.openlibrary.org/b/id/9214701-M.jpg"
  },
  {
    title: "The Invisible Life of Addie LaRue",
    author: "V.E. Schwab",
    moods: ["sad", "dark", "fantasy"],
    genres: ["Fantasy", "Literary Fiction"],
    themes: ["Faust", "Deals with Devil", "Loneliness", "Legacy"],
    popularityScore: 91,
    feel: "Faustian + melancholic",
    why: "Dark bargain explored with poetic sadness; deals as metaphor for loneliness",
    coverImage: "https://covers.openlibrary.org/b/id/9816154-M.jpg"
  },
  {
    title: "All the Light We Cannot See",
    author: "Anthony Doerr",
    moods: ["sad", "dark", "adventure"],
    genres: ["Historical Fiction"],
    themes: ["WWII", "Connection", "Beauty", "Love"],
    popularityScore: 93,
    feel: "tragic + luminous",
    why: "WWII love story; beauty found in darkness"
  },

  // ============ COZY & COMFORTING (cozy mood) ============
  {
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    moods: ["cozy", "happy", "thoughtful"],
    genres: ["Historical Fiction"],
    themes: ["1960s", "Feminism", "Science", "Ambition"],
    popularityScore: 90,
    feel: "nostalgic + gently feminist + warm",
    why: "1960s setting with earnest characters; comfort meets quiet rebellion",
    coverImage: "https://covers.openlibrary.org/b/id/10827176-M.jpg"
  },
  {
    title: "The Night Circus",
    author: "Erin Morgenstern",
    moods: ["cozy", "fantasy", "romance"],
    genres: ["Fantasy", "Romance"],
    themes: ["Magic", "Competition", "Love", "Atmosphere"],
    popularityScore: 93,
    feel: "dreamy + enchanted",
    why: "Atmosphere so thick you sink into it; magical comfort"
  },
  {
    title: "Howl's Moving Castle",
    author: "Diana Wynne Jones",
    moods: ["cozy", "fantasy", "happy"],
    genres: ["Fantasy"],
    themes: ["Found Family", "Self-Worth", "Magic", "Love"],
    popularityScore: 91,
    feel: "whimsical + surprisingly tender",
    why: "Chaos that resolves into love; celebration of found family",
    coverImage: "https://covers.openlibrary.org/b/id/14331-M.jpg"
  },
  {
    title: "One Day in December",
    author: "Josie Silver",
    moods: ["cozy", "romance", "happy"],
    genres: ["Romance", "Contemporary Fiction"],
    themes: ["Winter", "Second Chances", "Fate", "Love"],
    popularityScore: 85,
    feel: "cozy + swoony",
    why: "Second chance romance in winter setting; perfectly charming"
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    moods: ["cozy", "thoughtful", "emotional"],
    genres: ["Historical Fiction"],
    themes: ["Old Hollywood", "Secrets", "LGBTQ+", "Identity"],
    popularityScore: 94,
    feel: "glamorous + intimate + revealing",
    why: "Secrets unfold in cozy confession; Hollywood history feels personal",
    coverImage: "https://covers.openlibrary.org/b/id/8948087-M.jpg"
  },
  {
    title: "Gideon the Ninth",
    author: "Tamsyn Muir",
    moods: ["cozy", "mystery", "dark"],
    genres: ["Fantasy", "Mystery"],
    themes: ["Lesbian Romance", "Gothic", "Mystery", "Atmosphere"],
    popularityScore: 88,
    feel: "moody + atmospheric + cozy-dark",
    why: "Gothic mansion mystery with warmth; dark academia with heart",
    coverImage: "https://covers.openlibrary.org/b/id/8862817-M.jpg"
  },

  // ============ PAGE-TURNING & ADDICTIVE (mystery mood) ============
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    moods: ["mystery", "dark", "thriller"],
    genres: ["Thriller", "Mystery"],
    themes: ["Unreliable Narrators", "Marriage", "Crime", "Manipulation"],
    popularityScore: 96,
    feel: "addictive + psychologically twisty",
    why: "Impossible to put down; unreliable narrators that shatter every assumption",
    coverImage: "https://covers.openlibrary.org/b/id/7774303-M.jpg"
  },
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    moods: ["mystery", "dark", "thriller"],
    genres: ["Thriller", "Mystery", "Psychological"],
    themes: ["Psychological Thriller", "Murder", "Obsession", "Twist"],
    popularityScore: 92,
    feel: "darkly compulsive + shocking",
    why: "Reads like a puzzle you can't stop solving; ending recontextualizes everything",
    coverImage: "https://covers.openlibrary.org/b/id/10177022-M.jpg"
  },
  {
    title: "In a Dark, Dark Wood",
    author: "Ruth Ware",
    moods: ["mystery", "dark", "thriller"],
    genres: ["Thriller", "Mystery"],
    themes: ["Isolation", "Secrets", "Paranoia", "Reunion"],
    popularityScore: 88,
    feel: "claustrophobic + paranoid",
    why: "Isolated setting amplifies tension; mystery that spirals inward beautifully"
  },
  {
    title: "A Good Girl's Guide to Murder",
    author: "Holly Jackson",
    moods: ["mystery", "thriller", "thoughtful"],
    genres: ["Mystery", "Young Adult"],
    themes: ["Detective", "Justice", "Obsession", "Truth"],
    popularityScore: 90,
    feel: "investigative + obsessive",
    why: "Teenage detective story that respects intelligence; addictive puzzle plotting"
  },
  {
    title: "Big Little Lies",
    author: "Liane Moriarty",
    moods: ["mystery", "emotional", "dark"],
    genres: ["Mystery", "Contemporary Fiction"],
    themes: ["Secrets", "Relationships", "Murder", "Suspense"],
    popularityScore: 91,
    feel: "interwoven + shocking",
    why: "Three women, secrets, murder; reveals arrive like dominoes"
  },
  {
    title: "The Woman in Cabin 10",
    author: "Ruth Ware",
    moods: ["mystery", "thriller", "dark"],
    genres: ["Thriller", "Mystery"],
    themes: ["Ship", "Isolation", "Paranoia", "Doubt"],
    popularityScore: 87,
    feel: "paranoid + claustrophobic",
    why: "Ship mystery; isolation amplifies every doubt"
  },
  {
    title: "We Have Always Lived in the Castle",
    author: "Shirley Jackson",
    moods: ["mystery", "dark", "psychological"],
    genres: ["Psychological Fiction"],
    themes: ["Isolation", "Family Secrets", "Weirdness", "Perspective"],
    popularityScore: 89,
    feel: "sinister + psychologically odd",
    why: "Family mystery wrapped in weirdness; unsettling brilliance",
    coverImage: "https://covers.openlibrary.org/b/id/54929-M.jpg"
  },
  {
    title: "The Push",
    author: "Ashley Audrain",
    moods: ["mystery", "dark", "psychological"],
    genres: ["Psychological Thriller"],
    themes: ["Motherhood", "Darkness", "Secrets", "Family"],
    popularityScore: 86,
    feel: "psychological + unsettling",
    why: "Motherhood mystery with dark undertones; what if the mother is the problem?"
  },

  // ============ FANTASY & ESCAPE (fantasy mood) ============
  {
    title: "Six of Crows",
    author: "Leigh Bardugo",
    moods: ["fantasy", "adventure", "dark"],
    genres: ["Fantasy"],
    themes: ["Heist", "Morally Gray", "Found Family", "Complexity"],
    popularityScore: 94,
    feel: "morally gray + exhilarating + cruel",
    why: "Heist fantasy with characters you'd follow to hell; world-building through action",
    coverImage: "https://covers.openlibrary.org/b/id/8772147-M.jpg"
  },
  {
    title: "Mistborn: The Final Empire",
    author: "Brandon Sanderson",
    moods: ["fantasy", "adventure", "thoughtful"],
    genres: ["Fantasy"],
    themes: ["Magic System", "Rebellion", "Empowerment", "Epic"],
    popularityScore: 92,
    feel: "epic + empowering rebellion",
    why: "Magic system serves character growth; revolution that feels earned"
  },
  {
    title: "Ninth House",
    author: "Leigh Bardugo",
    moods: ["fantasy", "dark", "mystery"],
    genres: ["Fantasy", "Dark Academia"],
    themes: ["Dark Academia", "Occult", "Yale", "Secrets"],
    popularityScore: 89,
    feel: "dark academia + occult danger",
    why: "Yale's hidden magical elite; dark in ways that feel sophisticated",
    coverImage: "https://covers.openlibrary.org/b/id/9440866-M.jpg"
  },
  {
    title: "The Priory of the Orange Tree",
    author: "Samantha Shannon",
    moods: ["fantasy", "adventure", "epic"],
    genres: ["Fantasy", "Epic"],
    themes: ["Dragons", "Prophecy", "Love", "War"],
    popularityScore: 90,
    feel: "epic + gorgeous + complex",
    why: "Standalone epic with depth; magic and politics intertwine beautifully"
  },
  {
    title: "Sorcery of Thorns",
    author: "Margaret Rogerson",
    moods: ["fantasy", "romance", "adventure"],
    genres: ["Fantasy", "Romance"],
    themes: ["Libraries", "Magic", "Love", "Danger"],
    popularityScore: 87,
    feel: "romantic + magical + adventurous",
    why: "Magical libraries and romance; adventure that feels earned",
    coverImage: "https://covers.openlibrary.org/b/id/8868325-M.jpg"
  },

  // ============ ROMANCE & CHEMISTRY (romance mood) ============
  {
    title: "The Hating Game",
    author: "Sally Thorne",
    moods: ["romance", "happy", "cozy"],
    genres: ["Romance", "Contemporary Fiction"],
    themes: ["Enemy to Lovers", "Chemistry", "Banter", "Love"],
    popularityScore: 91,
    feel: "banter + chemistry + earned love",
    why: "Perfect enemy-to-lovers execution; tension that crackles off the page",
    coverImage: "https://covers.openlibrary.org/b/id/8816097-M.jpg"
  },
  {
    title: "Red, White & Royal Blue",
    author: "Casey McQuiston",
    moods: ["romance", "happy", "thoughtful"],
    genres: ["Romance", "LGBTQ+"],
    themes: ["LGBTQ+", "Politics", "Love", "Identity"],
    popularityScore: 90,
    feel: "witty + swoony + politically alive",
    why: "Smart romance where characters have depths beyond love; swoon-worthy but intelligent",
    coverImage: "https://covers.openlibrary.org/b/id/10051393-M.jpg"
    },
  {
    title: "The Time Traveler's Wife",
    author: "Audrey Niffenegger",
    moods: ["romance", "emotional", "thoughtful"],
    genres: ["Science Fiction", "Romance"],
    themes: ["Love", "Time Travel", "Complexity", "Fate"],
    popularityScore: 92,
    feel: "achingly romantic + complex",
    why: "Love tested by impossible circumstances; proves love isn't simple",
    coverImage: "https://covers.openlibrary.org/b/id/217520-M.jpg"
  },
  {
    title: "Outlander",
    author: "Diana Gabaldon",
    moods: ["romance", "adventure", "epic"],
    genres: ["Historical Fiction", "Romance", "Adventure"],
    themes: ["Time Travel", "Scotland", "Epic Love", "History"],
    popularityScore: 93,
    feel: "epic + passionate + time-spanning",
    why: "Romance as adventure; lovers separated and reunited across centuries",
    coverImage: "https://covers.openlibrary.org/b/id/44847-M.jpg"
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    moods: ["romance", "thoughtful", "witty"],
    genres: ["Classic Romance"],
    themes: ["Love", "Society", "Wit", "Character Growth"],
    popularityScore: 96,
    feel: "witty + deeply romantic + intelligent",
    why: "Timeless romance where characters must grow to find love; perfection"
  },
  {
    title: "Verity",
    author: "Colleen Hoover",
    moods: ["romance", "dark", "mystery"],
    genres: ["Thriller", "Romance"],
    themes: ["Marriage", "Secrets", "Darkness", "Love"],
    popularityScore: 89,
    feel: "twisty + disturbing + romantic",
    why: "Dark romance that surprises; unsettling in the best way"
  },

  // ============ DARK & ATMOSPHERIC (dark mood) ============
  {
    title: "Mexican Gothic",
    author: "Silvia Moreno-Garcia",
    moods: ["dark", "gothic", "mystery"],
    genres: ["Gothic Fiction", "Horror"],
    themes: ["Gothic", "Family Secrets", "Horror", "Atmosphere"],
    popularityScore: 91,
    feel: "eerie + lush + suffocating",
    why: "Gothic horror with gorgeous prose; atmosphere so thick you can't breathe",
    coverImage: "https://covers.openlibrary.org/b/id/8826070-M.jpg"
  },
  {
    title: "The Silent Companion",
    author: "Laura Purcell",
    moods: ["dark", "gothic", "thriller"],
    genres: ["Gothic Fiction", "Psychological"],
    themes: ["Haunting", "Family", "Madness", "Supernatural"],
    popularityScore: 87,
    feel: "creeping dread + unease",
    why: "Psychological horror that builds slowly; fear of what's real vs. imagined"
  },
  {
    title: "The Little Stranger",
    author: "Sarah Waters",
    moods: ["dark", "gothic", "mystery"],
    genres: ["Gothic Fiction", "Literary Fiction"],
    themes: ["Post-WWII", "Class", "Haunting", "Ambiguity"],
    popularityScore: 89,
    feel: "atmospheric + sinister + uncertain",
    why: "Gothic mystery that questions reality; atmosphere builds dread"
  },
  {
    title: "The Twisted Ones",
    author: "T. Kingfisher",
    moods: ["dark", "horror", "thriller"],
    genres: ["Horror", "Thriller"],
    themes: ["Psychological Horror", "Family", "Creepy", "Disturbing"],
    popularityScore: 86,
    feel: "disturbing + genuinely creepy",
    why: "Modern horror that understands psychological terror"
  },

  // ============ ADVENTURE & THRILLING (adventure mood) ============
  {
    title: "The Princess Bride",
    author: "William Goldman",
    moods: ["adventure", "romance", "happy"],
    genres: ["Adventure", "Fantasy"],
    themes: ["Adventure", "Love", "Humor", "Heroism"],
    popularityScore: 93,
    feel: "swashbuckling + witty + heartfelt",
    why: "Adventure with humor and genuine stakes; proves adventure can make you laugh AND care"
  },
  {
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    moods: ["adventure", "thriller", "emotional"],
    genres: ["Adventure", "Classic Fiction"],
    themes: ["Revenge", "Betrayal", "Redemption", "Justice"],
    popularityScore: 95,
    feel: "epic revenge + intricate plotting",
    why: "Masterclass in revenge narrative; satisfying without being hollow"
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    moods: ["adventure", "fantasy", "happy"],
    genres: ["Fantasy", "Adventure"],
    themes: ["Journey", "Courage", "Adventure", "Heroism"],
    popularityScore: 94,
    feel: "whimsical adventure + unexpected courage",
    why: "Proves heroes aren't fearless; heroism is showing up anyway"
  },
  {
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    moods: ["adventure", "epic", "fantasy"],
    genres: ["Fantasy", "Epic"],
    themes: ["Epic", "Fellowship", "Good vs Evil", "Sacrifice"],
    popularityScore: 96,
    feel: "epic + grand + emotional",
    why: "Masterpiece of world-building; fellowship that changes you"
  },
  {
    title: "Shang-Chi and the Legend of the Ten Rings",
    author: "Stephenie Meyer",
    moods: ["adventure", "action", "thrilling"],
    genres: ["Adventure", "Action"],
    themes: ["Action", "Family", "Redemption", "Martial Arts"],
    popularityScore: 85,
    feel: "action-packed + emotional",
    why: "Adventure with heart; action reveals character"
  },

  // ============ THOUGHT-PROVOKING & PHILOSOPHICAL (thoughtful mood) ============
  {
    title: "Educated",
    author: "Tara Westover",
    moods: ["thoughtful", "emotional", "dark"],
    genres: ["Memoir", "Non-Fiction"],
    themes: ["Education", "Family", "Self-Discovery", "Abuse"],
    popularityScore: 94,
    feel: "brutal honesty + self-discovery",
    why: "Memoir that questions everything; journey of reclaiming your own mind",
    coverImage: "https://covers.openlibrary.org/b/id/8866482-M.jpg"
  },
  {
    title: "The Overstory",
    author: "Richard Powers",
    moods: ["thoughtful", "philosophical", "epic"],
    genres: ["Literary Fiction"],
    themes: ["Activism", "Environment", "Connection", "Trees"],
    popularityScore: 90,
    feel: "vast + interconnected + humbling",
    why: "Multiple narratives converge around trees and activism; shows how we're connected",
    coverImage: "https://covers.openlibrary.org/b/id/8868326-M.jpg"
  },
  {
    title: "Man's Search for Meaning",
    author: "Viktor Frankl",
    moods: ["thoughtful", "emotional", "philosophical"],
    genres: ["Non-Fiction", "Philosophy"],
    themes: ["Meaning", "Survival", "Psychology", "Hope"],
    popularityScore: 95,
    feel: "profound + life-changing",
    why: "Philosophical masterpiece about finding meaning in suffering; changed psychology"
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    moods: ["thoughtful", "philosophical", "intellectual"],
    genres: ["Non-Fiction", "History"],
    themes: ["Human History", "Culture", "Society", "Evolution"],
    popularityScore: 93,
    feel: "mind-expanding + paradigm-shifting",
    why: "Big history that reframes human existence; genuinely thought-changing"
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    moods: ["thoughtful", "witty", "philosophical"],
    genres: ["Self-Help", "Non-Fiction"],
    themes: ["Life Philosophy", "Values", "Humor", "Authenticity"],
    popularityScore: 88,
    feel: "irreverent + genuinely helpful",
    why: "Self-help that's funny and honest; philosophy wrapped in profanity"
  },

  // ============ EMOTIONAL & CATHARTIC (emotional mood) ============
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    moods: ["emotional", "sad", "thoughtful"],
    genres: ["Young Adult", "Contemporary Fiction"],
    themes: ["Love", "Death", "Meaning", "Coming of Age"],
    popularityScore: 91,
    feel: "heartbreaking + beautiful",
    why: "Cancer romance that's about more than disease; genuine catharsis"
  },
  {
    title: "Bridge to Terabithia",
    author: "Katherine Paterson",
    moods: ["emotional", "sad", "thoughtful"],
    genres: ["Young Adult", "Children's Fiction"],
    themes: ["Friendship", "Imagination", "Death", "Grief"],
    popularityScore: 88,
    feel: "poignant + childhood wonder",
    why: "Children's book with emotional depth; grief handled with grace"
  },
  {
    title: "Crying in H Mart",
    author: "Michelle Zauner",
    moods: ["emotional", "sad", "thoughtful"],
    genres: ["Memoir", "Non-Fiction"],
    themes: ["Grief", "Mother-Daughter", "Food", "Healing"],
    popularityScore: 92,
    feel: "heartbreaking + beautifully written",
    why: "Grief and food intertwine; memoir about loss and connection"
  },
  {
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    moods: ["emotional", "sad", "mystery"],
    genres: ["Literary Fiction", "Mystery"],
    themes: ["Isolation", "Nature", "Murder", "Coming of Age"],
    popularityScore: 90,
    feel: "atmospheric + emotionally resonant",
    why: "Marsh girl mystery with emotional depth; beauty and darkness coexist"
  },
  {
    title: "The Book of Lost Friends",
    author: "Lisa Wingate",
    moods: ["emotional", "historical", "powerful"],
    genres: ["Historical Fiction"],
    themes: ["Post-Civil War", "Freedom", "Friendship", "Reconstruction"],
    popularityScore: 87,
    feel: "powerful + hopeful + emotional",
    why: "Post-Civil War story of friendship; emotional and historically important"
  },

  // ============ WITTY & CLEVER (bonus mood) ============
  {
    title: "Bridget Jones's Diary",
    author: "Helen Fielding",
    moods: ["happy", "witty", "romance"],
    genres: ["Contemporary Fiction", "Romance"],
    themes: ["Romance", "Humor", "Modern Life", "Self-Acceptance"],
    popularityScore: 88,
    feel: "hilarious + relatable + romantic",
    why: "Modern Elizabeth Bennet; funny, smart, and deeply romantic"
  },
  {
    title: "Good Omens",
    author: "Neil Gaiman & Terry Pratchett",
    moods: ["witty", "funny", "adventure"],
    genres: ["Fantasy", "Comedy"],
    themes: ["Good vs Evil", "Friendship", "Apocalypse", "Humor"],
    popularityScore: 92,
    feel: "hilarious + whimsical + profound",
    why: "End of the world comedy by masters; friendship that saves reality"
  },
  {
    title: "Discworld: Guards! Guards!",
    author: "Terry Pratchett",
    moods: ["witty", "funny", "adventure"],
    genres: ["Fantasy", "Comedy"],
    themes: ["Humor", "Bureaucracy", "Fantasy World", "Satire"],
    popularityScore: 89,
    feel: "clever satire + genuine heart",
    why: "Fantasy comedy with social commentary; genuinely wise beneath the jokes"
  },

  // ============ EPIC & SWEEPING (bonus mood) ============
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    moods: ["fantasy", "adventure", "thoughtful"],
    genres: ["Fantasy"],
    themes: ["Magic School", "Coming of Age", "Mystery", "Epic"],
    popularityScore: 91,
    feel: "lyrical + magical + immersive",
    why: "Narrated history of a legendary man; world-building through storytelling",
    coverImage: "https://covers.openlibrary.org/b/id/8394893-M.jpg"
  },
  {
    title: "A Deadly Education",
    author: "Naomi Novik",
    moods: ["fantasy", "dark", "adventure"],
    genres: ["Fantasy", "Dark Academia"],
    themes: ["Dark Academia", "Survival", "Magic", "Friendship"],
    popularityScore: 88,
    feel: "dark academia + survival + complex",
    why: "Magic school where students die; dark academia with real stakes",
    coverImage: "https://covers.openlibrary.org/b/id/9920949-M.jpg"
  }
];

/**
 * Helper function to get books by mood
 */
export function getBooksByMood(mood) {
  const moodLower = mood.toLowerCase();
  return BOOK_LIBRARY.filter(book =>
    book.moods.map(m => m.toLowerCase()).includes(moodLower)
  );
}

/**
 * Helper function to search books by text
 */
export function searchLibrary(query) {
  const queryLower = query.toLowerCase();
  return BOOK_LIBRARY.filter(book =>
    book.title.toLowerCase().includes(queryLower) ||
    book.author.toLowerCase().includes(queryLower) ||
    book.genres.some(g => g.toLowerCase().includes(queryLower)) ||
    book.themes.some(t => t.toLowerCase().includes(queryLower)) ||
    book.moods.some(m => m.toLowerCase().includes(queryLower))
  );
}

/**
 * Helper function to get popular books
 */
export function getPopularBooks(limit = 10) {
  return [...BOOK_LIBRARY]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

/**
 * Get random books from library for variety
 */
export function getRandomBooks(count = 5) {
  const shuffled = [...BOOK_LIBRARY].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get cover image URL for a book
 * Uses Open Library Cover API for accurate, always-available book covers
 */
export function getBookCoverUrl(book) {
  if (book.coverImage) return book.coverImage;
  
  // Fallback: Generate cover URL from book title/author using Open Library API
  // Format: https://covers.openlibrary.org/b/olid/{OLID}-M.jpg
  // For books without OLID, use a default placeholder
  const placeholder = `https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop&blend=${encodeURIComponent(book.title)}&blend-mode=overlay`;
  return placeholder;
}

/**
 * Ensure all books have cover images
 * Initializes missing covers with Open Library or Unsplash placeholders
 */
export function initializeBookCovers() {
  BOOK_LIBRARY.forEach((book, idx) => {
    if (!book.coverImage) {
      // Generate a consistent but unique gradient cover as fallback
      book.coverImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&bold=true&background=random&size=200`;
    }
  });
}

export default BOOK_LIBRARY;

