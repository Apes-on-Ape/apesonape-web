You are acting as both a senior creative director and a senior frontend engineer.

Your task is to COMPLETELY REDESIGN the existing apesonape.io website and implement the redesign across the full existing codebase.

DO NOT merely give me design recommendations.
DO NOT stop after auditing the repo.
Inspect the project first, understand the existing architecture and functionality, and then actually modify the application.

============================================================
THE CORE IDEA
============================================================

Transform Apes on Ape from a conventional NFT / Web3 website into:

                    "THE AOA SIGNAL"

An underground ApeChain broadcast network.

The emotional inspiration is the internet culture and anticipation generated around Roaring Kitty / GameStop:

- recurring signals
- cryptic but recognizable visual language
- ritual
- community inside jokes
- live presence
- episodic storytelling
- anticipation
- a recognizable narrator/personality
- the feeling that something is happening right now
- a community trying to decode and participate in a story

IMPORTANT:

Do NOT copy Roaring Kitty.
Do NOT copy GameStop branding.
Do NOT use GameStop logos.
Do NOT use Roaring Kitty images.
Do NOT use copyrighted movie clips or memes from his posts.
Do NOT create a financial trading website.
Do NOT add price promises, investment-return claims, fake scarcity, fake viewers, fake activity or artificial FOMO.

Take the CULTURAL MECHANICS and create a completely original Apes on Ape identity.

The website should feel like someone discovered an underground radio frequency broadcasting from ApeChain.

Think:

pirate radio
+
underground music station
+
hacked terminal
+
late-90s internet
+
arcade cabinet
+
Web3 culture
+
community message board
+
generative ape art
+
cinematic internet mystery

But make it PREMIUM.

Do not make it look like a cheap "hacker template."

============================================================
UNDERSTAND THE EXISTING PRODUCT BEFORE MODIFYING ANYTHING
============================================================

First inspect:

- package.json
- app/router structure
- components
- API routes
- authentication
- Glyph integration
- wallet integration
- ApeChain configuration
- NFT fetching
- collection APIs
- rarity functionality
- SoundCloud integrations
- Spotify integrations
- AOA Radio functionality
- Studio
- IPFS publishing
- Creative tools
- Wardrobe
- Arcade
- game loading / iframe / canvas functionality
- profiles
- leaderboards
- all environment variables
- database/API dependencies
- image assets
- audio assets
- existing shared layouts
- mobile behavior

Create a mental route map before changing the design.

Preserve all existing working functionality.

DO NOT replace real integrations with mocked interfaces.

DO NOT remove features merely because they are difficult to restyle.

If an existing backend/API implementation works, preserve it unless a change is genuinely necessary.

============================================================
PROJECT NARRATIVE
============================================================

The website should understand this story:

Apes on Ape is a collection of 10,000 Apes native to ApeChain.

It launched during the early ApeChain era.

The original artwork was challenged and taken down.

Instead of disappearing, the community rebuilt.

The artwork was recreated as an original collection.

SmokeThatDank and ApeProfessore became important contributors to the new art era.

The final rebuilt artwork was delivered to holders.

AOA then evolved beyond a PFP collection into:

AOA Records
AOA Radio
AI / Creator Studio
Creative tools
Wardrobe
Arcade
3D avatars
community-created music
community-created artwork
games
ApeChain culture

The site's emotional arc should therefore be:

CHAOS
→
SURVIVAL
→
REBIRTH
→
TRANSMISSION
→
CREATION
→
COMMUNITY

The DMCA/rebuild story should not be hidden.

Treat it like the project's origin story.

"Born from Chaos. Built for Culture."

============================================================
BRAND PERSONALITY
============================================================

SmokeThatDank's communication style should influence the CHARACTER of the website without making the entire project about one individual.

Recurring phrases already associated with the community may appear sparingly:

TURN YOUR VOLUME UP
TURN YOUR RADIO ON
APES TOGETHER STRONG
HIGHER
NFA

Do not plaster every phrase everywhere.

Their effectiveness comes from repetition at meaningful moments.

Smoke should function almost like the station's DJ / broadcaster / narrator.

The COMMUNITY remains the protagonist.

AOA should feel:

rebellious
strange
fun
self-aware
confident
creative
slightly chaotic
underground
alive

It should NOT feel:

corporate
generic Web3
VC-backed SaaS
over-polished luxury NFT
casino-like
financially manipulative

============================================================
VISUAL SYSTEM
============================================================

Create a new global design system.

Primary background:
#050505 / almost black

Secondary:
warm off-white / newsprint

Signal accent:
acid yellow-green / radioactive lime

Live indicator:
strong red

Occasional ApeChain / digital accents can use electric blue or violet,
but avoid rainbow Web3-gradient overload.

Typography:

1. Very large condensed/grotesk display typography
2. Clean grotesk for UI
3. Monospace for metadata / transmissions / blockchain information

Use the project's existing fonts when appropriate.
If introducing fonts, use reputable web fonts and optimize loading.

Visual motifs:

CRT scanlines
light film grain
broadcast noise
monospace metadata
timestamps
waveforms
signal strength
transmission IDs
chapter numbers
crosshairs
audio meters
tape/cassette references
terminal cursors
oversized typography
ticker strips
image crops
raw community artwork
APE IDs
blockchain hashes

Effects should be subtle and intentional.

NO constant flashing.

NO excessive glitch animation.

NO unreadable distortion.

Respect prefers-reduced-motion.

============================================================
SITE-WIDE HEADER
============================================================

Create a compact persistent header.

LEFT:
AOA logo / Apes on Ape identity

CENTER desktop navigation:

SIGNAL
COLLECTION
RADIO
STUDIO
ARCADE
WARDROBE
STORY

RIGHT:

LIVE indicator when applicable
Connect / Glyph profile control

On mobile use a well-designed full-screen menu.

The navigation should feel like switching frequencies/channels.

============================================================
HOMEPAGE
============================================================

The homepage is the most important redesign.

It must no longer feel like a conventional NFT landing page.

----------------------------
OPENING / BOOT SEQUENCE
----------------------------

On the visitor's FIRST session, show a very short 500-1000 ms boot/tuning sequence.

Examples:

SEARCHING FOR SIGNAL...
APECHAIN // 33139
FREQUENCY FOUND
AOA TRANSMISSION ONLINE

Then reveal the site.

Never make repeat visitors wait unnecessarily.

Persist the completed state in session storage.

----------------------------
HERO
----------------------------

Full viewport.

Dark.

One powerful Ape image or continuously changing selection of real AOA art.

Subtle noise / parallax / broadcast treatment.

Primary headline:

TURN YOUR
VOLUME UP.

Alternative rotating secondary messages:

10,000 APES.
ONE SIGNAL.

THE RADIO NEVER SLEEPS.

BUILT AFTER THE TAKEDOWN.

STILL HERE.

Do not rotate too quickly.

Subtext:

"An on-chain creative network broadcasting from ApeChain."

Primary CTA:

ENTER THE SIGNAL

Secondary CTA:

LISTEN LIVE

Also display a small:

● AOA RADIO — LIVE

when there really is a live state.

Never fake a live state.

Do NOT autoplay audio.

Give users an obvious:
TURN SOUND ON
control.

----------------------------
GLOBAL AOA RADIO PLAYER
----------------------------

AOA Radio must become one of the defining website features.

Build/refactor a persistent player dock that survives navigation when technically possible.

Desktop:
bottom horizontal broadcast console.

Mobile:
compact mini-player expandable into full player.

Show:

album artwork
artist
track
play/pause
previous/next where supported
volume
progress
source
LIVE badge if actual stream
open full Radio/Music page

Style it like a pirate-radio broadcast deck rather than Spotify.

Preserve the existing SoundCloud/Spotify/audio logic.

----------------------------
THE LIVE SIGNAL
----------------------------

Immediately after the hero create:

THE SIGNAL

A dynamic activity stream.

Instead of showing an empty Studio section, select meaningful activity from across the whole AOA ecosystem.

Potential signals:

new music release
currently/live recently broadcast
Studio creation
Arcade high score
new community artwork
featured Ape
new Wardrobe item
community event
new album
important project update

Only display REAL data.

If a source has nothing recent, gracefully choose another content type.

Never show a huge dead/empty section on the homepage.

Use cards that resemble intercepted transmissions:

TRANSMISSION 024
11:42 UTC
AOA RECORDS
NEW SIGNAL DETECTED

Do not invent fake timestamps.

----------------------------
AOA RECORDS
----------------------------

Music should be significantly more prominent than it currently is.

Create a cinematic section:

AOA RECORDS
THE SOUND OF APECHAIN

Feature:

current track
latest albums
artists
real play/follower/release statistics where available
live broadcasts
"LISTEN NOW"

Use album covers like record sleeves / tapes / broadcast cards.

Do not hardcode statistics independently across many files.

Create one shared stats/data source.

----------------------------
THE REBIRTH
----------------------------

Build a short cinematic storytelling section.

Heading:

THEY TOOK THE ART DOWN.
THE APES BUILT AGAIN.

or use existing approved project copy where appropriate.

Show the original/reborn story using existing project assets.

Visual progression:

01 / LAUNCH
02 / TAKEDOWN
03 / REBUILD
04 / NEW ART
05 / AOA RECORDS
06 / THE SIGNAL

This should tease the full About/Story page.

CTA:

READ THE FULL TRANSMISSION

Do not sensationalize legal facts.
Use the actual existing documented project story.

----------------------------
10,000 APES
----------------------------

Transform the collection preview.

Do not use a generic NFT grid.

Make it feel like scanning a database.

Examples:

APE // 0042
SIGNAL FOUND

APE // 1337
TRAIT DATA

Allow unusual staggered sizing/scrolling on desktop while preserving accessibility.

CTA:

SCAN ALL 10,000

----------------------------
THE NETWORK
----------------------------

Present the major AOA tools as channels rather than ordinary SaaS cards:

CHANNEL 01
AOA RECORDS

CHANNEL 02
CREATOR STUDIO

CHANNEL 03
WARDROBE

CHANNEL 04
ARCADE

CHANNEL 05
3D / OTHERSIDE

CHANNEL 06
CREATIVE TOOLS

Each card should have motion/art relevant to the product.

----------------------------
COMMUNITY
----------------------------

Build:

THE APES ARE THE SIGNAL.

Feature real project contributors/community members using existing data.

Avoid generic "Meet our team" corporate styling.

Use portrait/Ape artwork + handle + what they create.

If an X integration already exists, preserve it.

Do NOT implement fragile unauthorized scraping.

If live X data isn't available, use curated data already in the repository or a clearly maintainable configuration.

----------------------------
FINAL HOMEPAGE MOMENT
----------------------------

End with giant typography:

STILL BUILDING.
STILL LOUD.
STILL TOGETHER.

Then:

TURN THE RADIO ON.

Buttons:

AOA RADIO
EXPLORE THE APES
JOIN THE COMMUNITY

============================================================
MUSIC / AOA RECORDS PAGE
============================================================

This should feel like entering an underground radio station.

Not a conventional list of SoundCloud embeds.

Large NOW PLAYING area.

Waveform/spectrum visualization when technically reasonable.

Artist selector should resemble station presets.

Albums should resemble physical records/tapes/CD cases while remaining modern.

Create clear sections:

NOW TRANSMITTING
ARTISTS
LATEST RELEASES
ARCHIVE
TOP TRACKS
AOA RECORDS

Preserve every existing artist and playable track.

Make SmokeThatDank prominent based on actual catalogue/activity but do not erase the other artists.

AOA Records should clearly feel community-powered.

============================================================
ABOUT / STORY PAGE
============================================================

Turn About into a documentary-style dossier.

Title:

BORN FROM CHAOS.
BUILT FOR CULTURE.

Use large dates and archival-style visual storytelling.

The DMCA → rebuild → final artwork → creator ecosystem timeline is the centerpiece.

For the before/after artwork:

large interactive slider if suitable
or
side-by-side comparison

Label everything clearly.

No unnecessary corporate prose.

Short sentences.
Specific events.
Real dates.

Finish with:

THE STORY IS STILL BEING WRITTEN.

============================================================
COLLECTION PAGE
============================================================

Keep all existing NFT functionality.

Redesign as:

AOA ARCHIVE / SIGNAL DATABASE

Support:

token ID search
trait filtering
rarity
sorting
wallet/ownership state if already supported
pagination/infinite load as appropriate

Card design:

large artwork
APE #XXXX
rarity / relevant metadata
traits exposed elegantly on interaction

NFT detail pages should include:

very large artwork
token number
traits
rarity
owner information where already available
ApeChain verification/link
USE IN STUDIO
DRESS THIS APE
relevant marketplace link

Marketplace links must remain clearly external.

Do not make floor price the emotional focus of this page.

============================================================
STUDIO
============================================================

Rebrand visually as:

AOA LAB

or retain Studio name but give it a creator-laboratory personality.

Publishing flow must remain extremely usable.

Preserve:

Glyph
prompt
image
IPFS
metadata
hashing
remixing
wallet attribution
existing API behavior

Make published creations feel like "artifacts intercepted from the network."

Artifact IDs and IPFS metadata fit naturally into the broadcast/terminal aesthetic.

Do NOT sacrifice usability for styling.

============================================================
CREATIVE TOOLS
============================================================

Unify all current creative tools into a clear modular interface.

Think:

AOA TOOLBOX
or
TRANSMISSION LAB

Each tool is a MODULE.

MODULE 01
PFP

MODULE 02
BANNER

MODULE 03
STICKERS

MODULE 04
QR

etc., based on what actually exists in the repo.

============================================================
WARDROBE
============================================================

Keep the customization interface functional.

Transform the experience into an underground dressing room / loadout screen.

LEFT:
Ape / collection selector

CENTER:
large live character preview

RIGHT:
inventory / equipped traits

Use terminology such as:

LOADOUT
EQUIPPED
INVENTORY

only where it improves UX.

Make mobile especially usable.

============================================================
ARCADE
============================================================

The existing Arcade concept is already directionally strong.

Keep:

INSERT COIN
PLAYER 1
cabinet/game concept
leaderboards
holder authentication

Improve it rather than replacing it.

Bring its design quality up to the new site's standard.

Give each game a strong cabinet/cover-art tile.

Preserve all actual game-loading mechanisms.

Do not break mobile games.

============================================================
PROFILE
============================================================

If the project contains profile pages, redesign them as:

OPERATOR PROFILE

Show existing available data such as:

wallet
linked Ape(s)
avatar
Studio creations
Arcade scores
streaks
activity
music-related identity where relevant

Do not create fake reputation systems.

============================================================
EMPTY STATES
============================================================

This is important.

Never allow an empty area to make the ecosystem look abandoned.

Examples:

Instead of:

"No studio images in the last 48 hours."

Use an intentional designed state such as:

NO NEW VISUAL TRANSMISSIONS
RADIO SIGNAL REMAINS ACTIVE

Then surface another real active feed.

However, DO NOT misrepresent actual activity.

============================================================
COPYWRITING
============================================================

Reduce generic Web3 language.

Avoid:

"revolutionizing the future"
"next-generation ecosystem"
"unlock limitless possibilities"
"join the revolution"
"innovative blockchain experience"

Prefer short, memorable writing.

Examples of tone:

SIGNAL ACQUIRED.

RADIO ON.

10,000 APES.
NO CORPORATE PLAYBOOK.

WE REBUILT.

PRESS START.

CREATE SOMETHING.

BROADCAST IT.

THE APES ARE STILL HERE.

Do not overuse these.

Whitespace and silence are part of the experience.

============================================================
MOTION
============================================================

Use animation intentionally:

slow Ape image drift
signal interference during transitions
ticker movement
waveforms
hover distortions
terminal cursor
small text reveals
scroll-linked chapter transitions

Do NOT:

shake the screen constantly
flash
make text difficult to read
use giant amounts of JavaScript for decorative effects

Prefer CSS animations where possible.

If Framer Motion or another animation system already exists, use it appropriately rather than introducing redundant dependencies.

============================================================
RESPONSIVE DESIGN
============================================================

Design mobile FIRST enough that this does not become a desktop-only art project.

On mobile:

large readable typography
horizontal content rails where appropriate
compact Radio player
fast images
no hover-dependent functionality
touch-friendly filters
working Arcade navigation
comfortable Studio forms
stable wallet/Glyph controls

Test:

320px
375px
390px
430px
tablet
1440 desktop
large desktop

============================================================
ACCESSIBILITY
============================================================

Maintain strong contrast.

Semantic HTML.

Keyboard navigation.

Visible focus states.

ARIA labels where required.

Meaningful alt text.

prefers-reduced-motion support.

Audio NEVER autoplays with sound.

============================================================
PERFORMANCE
============================================================

The site should FEEL visually dense but remain fast.

Optimize:

next/image or equivalent
image dimensions
lazy loading
font loading
code splitting
heavy Arcade assets
audio
animation
client components

Do not load all 10,000 NFT images on initial homepage render.

Keep CLS low.

Avoid unnecessary hydration.

============================================================
SEO / SOCIAL SHARING
============================================================

Update page metadata consistently.

Create strong OG metadata structure for:

homepage
collection
individual Apes
music
albums where routes exist
Studio artifacts
About
Arcade

Preserve existing canonical URLs.

Do not accidentally remove indexed content during the redesign.

============================================================
DATA CONSISTENCY
============================================================

Audit project statistics because the current site may display related figures in multiple places.

Do not hardcode:

holder totals
music plays
track totals
release totals
community size

in multiple components.

Create a central source of truth or consume the existing API/data source.

If a metric is static rather than live, make that obvious in the implementation and easy to update.

============================================================
IMPORTANT FUNCTIONAL RULES
============================================================

Do not break:

Glyph authentication
wallet connections
ApeChain configuration
contract links
NFT collection loading
NFT detail pages
rarity
Studio publishing
IPFS
SoundCloud
Spotify
AOA Radio
Wardrobe
Creative tools
Arcade games
leaderboards
profiles
external marketplace links
existing APIs

Do not expose secrets.

Do not move server-only environment variables into client components.

Do not alter smart contracts.

Do not change database schemas unless absolutely necessary.

============================================================
ENGINEERING QUALITY
============================================================

While implementing:

consolidate duplicate components
remove obsolete styles made unnecessary by the redesign
create reusable primitives
create clean design tokens
maintain strong TypeScript typing
avoid giant monolithic components
use sensible component boundaries
retain server components where appropriate
do not convert everything into client components

Create reusable components such as appropriate to the existing framework:

SignalTicker
BroadcastLabel
TransmissionCard
NoiseOverlay
AOARadioPlayer
SectionMarker
ApeCard
ArtistCard
LiveIndicator
ChapterHeading
TerminalMetadata
CommunityOperator
ChannelCard

Names can differ if the existing architecture suggests better conventions.

============================================================
TESTING
============================================================

When implementation is complete:

run the existing lint command
run TypeScript checking
run tests
run the production build

Fix errors rather than simply reporting them.

Search the project for broken links.

Check console errors.

Check all major routes.

Check responsive behavior.

Check authentication controls.

Check image loading.

Check audio.

Check Studio forms.

Check Collection filters.

Check Arcade loading.

Do not leave placeholder Lorem Ipsum.

Do not leave TODO comments for core functionality.

============================================================
FINAL DELIVERABLE
============================================================

I want the actual website redesigned in the repository.

When finished, give me:

1. short summary of what changed
2. route-by-route summary
3. components added/removed
4. functional integrations preserved
5. any dependency changes
6. tests/build results
7. anything requiring environment credentials that prevented verification

The finished experience should create this reaction:

"What the hell is this?"

then:

"This is alive."

then:

"I want to see what happens next."

Most importantly:

Do not create another NFT landing page.

Build a CULTURAL BROADCAST NETWORK for Apes on Ape.