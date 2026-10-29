# FlowBoard Design System

This describes how FlowBoard is meant to look, based on the Figma file "FlowBoard Designs" (page: Base Designs). It is written in plain language so designers, writers and developers can all use it.

**A note on where this comes from.** The Figma file does not define named colors, text styles or spacing tokens. Everything here was read from how the screens are actually drawn. That means the names below (like "Ink" or "Accent blue") are my labels, not names that exist in Figma. Exact values are given in brackets so nothing is lost.

**What the file covers.** Five screens: Log-in Form, Homepage (My Boards), Create Project Board (modal), Create Card Modal (board view plus "Card" modal) and Card Created Homepage (board view with one card). The design is for a light theme only. There is no dark mode in the file.

---

## 1. The overall feel

Clean, calm and lightly rounded. Mostly white and pale grey surfaces, near-black text, soft grey secondary text, and one strong blue used sparingly for the main action. Edges are defined by very faint outlines rather than heavy borders, and shadows appear only on floating things (the sign-in panel and pop-up windows).

---

## 2. Colors

### Core palette

| Name (my label) | Value | Where it is used |
|---|---|---|
| **Ink** (near black) | #0A0A0A | Main text: headings, card titles, form labels, button text on light backgrounds |
| **Muted grey** | #717182 | Secondary text: dates, hints, placeholder text, the card counter, small field labels, the "Add card" link, inactive tabs, the "Boards" breadcrumb |
| **Page grey** | #F3F4F6 | The sign-in page background, the status columns on the board, the tab strip behind the sign-in tabs |
| **White** | #FFFFFF | Cards, board tiles, input fields, modals, the sign-in panel, the navigation bar, the active tab |
| **Hairline** | Black at 10% opacity | The thin outline around cards, board tiles and input fields, and the line under the navigation bar |
| **Accent blue** | #0369A1 | The primary button (Sign in, Save), the logo tile, the "Forgot password?" link |
| **Focus tint** | #E0E7FF (pale indigo) | An input field while it is being typed in. Its outline disappears and the field fills with this color |
| **Danger red** | #D4183D | The "Delete card" action only |
| **Overlay** | Black at 50% opacity | The dark veil behind a pop-up window |

### How the colors are used together

- Text on white or Page grey is always Ink for important words and Muted grey for supporting words.
- White text is used only on Accent blue.
- Blue means "do this". It appears on one main button per screen. Nothing else is filled with blue except the small logo tile.
- Red is saved for destructive actions and appears as text only, not as a filled button.
- Cards are white on top of grey columns. That contrast is what makes the cards stand out, so keep columns grey and cards white.

### Not defined in the file

The designs do not show colors for priority levels (High, Medium, Low), overdue dates, error messages, success messages, hover states, or disabled buttons. These need to be decided separately.

---

## 3. Typography

**Typeface:** Inter, used everywhere. Three weights: regular, medium and semi-bold. Most of the interface uses regular and medium. Semi-bold appears only once, on the "FlowBoard" name on the sign-in screen.

Text is set slightly tight (letters pulled a touch closer together) at the 14 to 18 point sizes. The largest size is set very slightly loose. The small uppercase labels are set noticeably loose.

### The type scale

| Role | Size | Weight | Line height | Letter spacing | Example in the designs |
|---|---|---|---|---|---|
| **Page title (brand)** | 24 | Semi-bold | 32 | Very slightly loose | "FlowBoard" on the sign-in screen |
| **Page title (screen)** | 24 | Medium | 32 to 36 | Very slightly loose | "My Boards", the board name in the top bar ("new board") |
| **Section / modal heading** | 18 | Medium | 27 to 28 | Slightly tight | "Create board", "Card" (the pop-up titles) |
| **Board tile title** | 18 | Medium | 27 | Slightly tight | "Project Title" on a board tile |
| **Body and input text** | 16 | Regular | Default (24 in text areas) | Tight | Text typed into fields, placeholder text, the breadcrumb separator |
| **Button label (large)** | 16 | Medium | 24 | Tight | "Sign in", "Save", "Cancel", "Create" |
| **Label and UI text** | 14 | Medium | 20 | Slightly tight | Field labels ("Name", "Email Address"), column titles ("To Do"), "Add card", "Delete card" |
| **Supporting text** | 14 | Regular | 20 | Slightly tight | Dates on board tiles, card titles, the tagline under the logo, "3 columns", "Forgot password?" |
| **Small caps label** | 12 | Medium | 16 | Loose, ALL UPPERCASE | "DESCRIPTION", "PRIORITY", "DUE DATE" |
| **Counter** | 12 | Regular | 16 | Normal | The number inside the pill on each column |

### Typography rules of thumb

- There are really only four sizes in regular use: 24, 18, 16 and 14. The 12 point size is only for small labels and the counter.
- Standard field labels are 14 medium in Ink. The compact uppercase 12 point label in Muted grey is used for the secondary fields in the card pop-up (Description, Priority, Due Date). The first field in each form (Name, Board name) uses the standard label. Pick one style per form and keep it consistent, because the card pop-up currently mixes both.

---

## 4. Spacing and sizing

### The spacing steps

Almost all spacing comes from this short list: **4, 8, 12, 16, 24, 32** (in pixels).

| Step | Where it appears |
|---|---|
| **4** | Inner padding of the sign-in tab strip |
| **8** | Gap between a field's label and its input; gap between a board tile's title and date; gap between an icon and its text ("Add card"); vertical padding inside a tab |
| **12** | Left and right padding inside text fields; gap between footer buttons; gap between breadcrumb items |
| **16** | Gap between form fields; inner padding of a column; gap between a column's header, cards and "Add card"; gap between board tiles; gap between columns |
| **24** | Padding inside pop-up windows; gap between a pop-up's heading and its form; gap between the sign-in tabs and the form below them; sideways padding inside each tab |
| **32** | Padding inside the sign-in panel; sideways padding of the top bar; page margins on the board view; gap between the logo block and the sign-in panel |

### Corner rounding

| Size | Used on |
|---|---|
| **10** | The main rounding: cards, board tiles, columns, input fields, buttons, the tab strip |
| **16** | Large floating panels: the sign-in panel and pop-up windows |
| **14** | The blue logo tile |
| **8** | The tabs inside the tab strip |
| **Fully round (pill)** | The number counter on each column |

### Fixed sizes

| Item | Size |
|---|---|
| Text field height | 46 |
| Dropdown height | 38 |
| Primary button height | 44 |
| Top bar on the board view | 69 high, with a hairline underneath |
| Top bar on the boards list | 65 high |
| Sign-in panel | 448 wide |
| Create board pop-up | 448 wide |
| Card pop-up | 512 wide |
| Board tile | 308 wide by 105 high |
| Status column | About 319 wide, 224 high in the sample |
| Boards list content width | 1280, centered |
| Logo tile | 48 by 48 with a 24 by 24 icon |

### Page layout

- **Sign-in screen:** everything centered on a Page grey background. From top to bottom: blue logo tile, "FlowBoard", the tagline, then the white sign-in panel.
- **Boards list:** a white top bar, then a centered 1280-wide content area. The title "My Boards" sits on the left, the Create button on the right (140 wide by 44 high), and board tiles run in a row underneath with 16 between them. The content starts 32 below the top bar.
- **Board view:** two stacked bars at the top (an app bar, then the board bar), then the columns start 24 below with 32 of margin on the left and right. Columns sit side by side with 16 between them.

---

## 5. Component patterns

### 5.1 Status column (the lane that holds cards)

A rounded (10) Page grey container with 16 of padding all round and 16 between its parts. Top to bottom:

1. **Header row.** The column name on the left ("To Do") in 14 medium Ink. On the right, a small white pill showing how many cards are in the column, in 12 regular Muted grey. The pill is about 22 wide and 20 high with 8 of sideways padding.
2. **Card area.** A vertical stack of task cards that fills the available space. The card area is a flexible slot, so it grows as cards are added.
3. **"Add card" row.** Pinned to the bottom. A small plus icon (16) followed by "Add card" in 14 medium Muted grey, with 8 between them. It reads as quiet link text, not a button.

The designs show three columns on the board ("3 columns" in the top bar), and the sample column is titled "To Do". The other column names are not shown in the file.

### 5.2 Task card (the item on the board)

A white rounded (10) box with the hairline outline. It is as wide as its column's card area (287 in a 319 column). It has about 13 of padding all round, so the text lines up with the column's header. The designed card contains **only the card title**, in 14 regular Ink, on a single line. The sample card is 46 high and reads "New Task".

The designs do not show the description, priority, due date or assignee on the card face. They exist only inside the Card pop-up. If those need to appear on the card, that is a design decision still to be made.

### 5.3 Board tile (on the boards list)

Same family as the task card but larger and roomier: white, rounded (10), hairline outline, 308 by 105, with about 25 of padding. It shows two lines:
- The board title in 18 medium Ink ("Project Title")
- The creation date in 14 regular Muted grey ("May 7, 2026"), 8 below the title

### 5.4 Pop-up windows (modals)

- A **dark veil** (50% black) covers the whole page behind the pop-up.
- The pop-up is a white panel with rounded (16) corners and a large soft shadow, centered on the screen. Padding is 24.
- The heading is 18 medium Ink on the left. In the Card pop-up there is a small close "X" icon (20) on the right. The Create board pop-up has no X, only a Cancel button.
- Content is separated from the heading by 24, and fields are 16 apart.
- The **footer** is a row of buttons aligned to the right with 12 between them. In the Card pop-up it is separated from the form by a hairline across the full width, and "Delete card" sits on the left in red.

**Create board pop-up:** one field ("Board name", placeholder "e.g. Product Roadmap"), then Cancel and Create.

**Card pop-up fields, in order:** Name (single line), Description (multi-line, 80 high), then Priority (a dropdown) and Due Date (a date picker) side by side, each half the width with 16 between. The footer has Delete card, Cancel and Save.

### 5.5 Form fields

- **Label above the field**, 8 gap.
- **Field:** white, rounded (10), hairline outline, 12 of sideways padding, 10 of vertical padding. 46 high for single-line fields.
- **Placeholder text** is 16 regular Muted grey.
- **Focused state:** the outline vanishes and the field fills with the pale indigo Focus tint. This is the only focus style in the file.
- **Dropdown and date picker** are drawn as empty white boxes in the designs, 38 and 42 high respectively. Their open state, option list and calendar are not designed.

### 5.6 Buttons

| Kind | Look | Used for |
|---|---|---|
| **Primary** | Accent blue fill, white 16 medium text, rounded (10), 44 high | Sign in, Save, Create, and the "create board" button on the list |
| **Secondary / cancel** | No fill and no outline, Ink 16 medium text | Cancel |
| **Destructive** | Red 14 medium text, no fill | Delete card |
| **Quiet link** | Muted grey 14 medium text, optional small icon | Add card |
| **Text link** | Accent blue 14 regular text | Forgot password? |
| **Icon button** | Bare 20 icon, no frame | Closing the Card pop-up |

Primary buttons size to their text with 16 of sideways padding, except the sign-in button, which stretches to the full width of the panel.

Hover, pressed, focus-ring and disabled looks for buttons are not in the file.

### 5.7 Sign-in panel

A white panel (448 wide, rounded 16, medium shadow, 32 padding) holding:
1. A **three-way tab strip**: Password, Magic link, Sign up. The strip is Page grey and rounded (10), 44 high. The selected tab is a white pill (rounded 8) with a very light shadow and Ink text. Unselected tabs have Muted grey text.
2. Below it, with 24 of space, the form: Email Address, Password, a right-aligned "Forgot password?" link in blue, then the full-width blue Sign in button. Fields are 16 apart.

### 5.8 Top bars

- **Boards list bar (65 high):** a white strip with a hairline underneath.
- **Board view bar (69 high):** same style. It shows a breadcrumb: "Boards" in 16 medium Muted grey, a "/" separator, then the board name in 24 medium Ink, followed by "3 columns" in small 14 Muted grey text. A second app-level bar sits above it on the board screens.

### 5.9 Logo

A 48 by 48 Accent blue rounded square (14) containing a white 24 icon, with the word "FlowBoard" under it. The icon looks like a columns or board symbol.

---

## 6. Things the designs show that the app may not do yet

Worth checking against what is built, since the designs include them:

- Sign-in has three modes in the designs: **Password, Magic link and Sign up**, plus a **Forgot password?** link.
- Cards in the Card pop-up have a **Priority dropdown, a Due Date picker, a Description and a Delete card action**.
- Each column shows a **card count**.
- The board view has a **breadcrumb** back to the boards list and a **column count**.

---

## 7. Gaps to fill in before building more

The file does not yet answer these. They should be decided and drawn before they are built:

1. Colors for the High, Medium and Low priority levels
2. Error, success and warning message styles (for example, a wrong password)
3. Hover, pressed, disabled and keyboard-focus looks for buttons, cards and tiles
4. What a card looks like with a description, priority, due date or assignee visible
5. The empty board state and the empty column state
6. The open dropdown and the date-picker calendar
7. The names of the other two columns
8. Drag-and-drop look (lifted card, drop target)
9. Mobile and tablet layouts. Every screen in the file is drawn at 2034 wide, desktop only
10. A dark theme, if one is wanted
