# Design system

Machine-readable values are in `design/tokens.json`. Reference markup is in `design/screens/`.
The look follows the owner's earlier app (WIIFII): one full-colour hero that changes with the verdict,
heavy display type, white cards on warm grey, black pills.

## The colour rule

- **Blue, yellow, red** mean go, caution, no-go, and the limit marker. Nothing else.
- **Ink, white, warm grey** are structural: cards, buttons, navigation, the compass bezel.
- **One accent per screen**: today's verdict colour. The compass marker, sun and rain bars take it.
- Colour is never the only signal. Every verdict also has a word.
- Bright yellow is too weak for thin shapes on white. Use the darker amber (`cautionOnWhite`) there.
- On a yellow hero, text and bars are ink, and the limit marker is dark blue.

## Type

- Display: Archivo Black. Hero number 104 px, verdict 34 px, card numbers 20–56 px.
- Text: Inter, weights 400–700. Body 15 px, detail 13 px, labels 12 px.
- Card titles are 15 px / 700 everywhere.

## Shape and spacing

- Screen padding 20. Gap between cards 12.
- Card radius 22. Inner tiles 16–18. Pills fully round. Hero bottom corners 44.
- Minimum touch target 44. Primary button height 56.

## Components

**Hero.** Full-width block in the verdict colour. Wordmark top left, activity and place pill top right.
Then the gust number with its unit, the verdict word, one line of plain language.
Then two horizontal bars (gusts thick, steady wind thin) on a 0–40 scale, with a vertical limit line
crossing both and a "Your limit N" label above it.

**Compass ("B2").** A thick ink bezel with white ticks at the eight points. A round marker rides on the
bezel at the bearing the wind comes **from**, in the verdict colour with a white outline. The abbreviation
(SW) is in the centre. The owner rejected arrow and needle designs; do not reintroduce them.

**Status row.** White card: title, one line of detail, optional thin level bar; on the right a coloured
pill with the value and a one-word verdict under it. Used for conditions.

**Hourly row.** Time, horizontal bar, value, verdict word. A black line through every row marks the limit.
The current hour is bold.

**Dark block.** Ink background, three columns: white line icon, value, label. For secondary readings
(humidity, UV index, temperature).

**Rain chips.** Soft grey tiles: day, percent, thin bar, amount. Unknown is a dashed outline with "?".

**Daylight.** A flattened arc with the elapsed part in the accent, a sun marker, sunrise and sunset below.

**Alert banner.** Ink card under the hero: yellow warning icon, alert name, one line, chevron.
Only rendered when an alert is active.

**Segmented switch.** Summary / Hourly / Raw data, under the hero. Active segment is an ink pill.

**Bottom navigation.** Four destinations. Android: ink pill behind the active icon. iOS: drop the pill
and tint the icon.

**Wind icon.** Five strength levels. Two candidate styles in `design/icons/`: windsock (recommended)
and streaks. Shape shows strength; colour shows the verdict. Not yet chosen by the owner.

## Voice

Plain, short, specific. "Clear to lift until 2 PM", not "Favourable conditions expected".
Every number has a unit and a word next to it.
