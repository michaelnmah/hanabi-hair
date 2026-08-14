---
target: Hanami Hair homepage
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-14T00-29-58Z
slug: apps-web-src-app-tsx
---
Method: dual-agent (A: critique_design · B: critique_evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Toasts, bag count, checkout busy copy, and subscription confirmation work; the product card does not retain an added state. |
| 2 | Match System / Real World | 2 | Luxury-hair language is natural, but “From” pricing plus instant Quick Add omits the configuration shoppers expect. |
| 3 | User Control and Freedom | 3 | Cart quantities and close buttons are reversible, but Escape does not close the drawer and focus does not move into it. |
| 4 | Consistency and Standards | 3 | The visual system is cohesive; several links promise destinations they do not provide. |
| 5 | Error Prevention | 1 | An underspecified base product can be added without length, bundle count, colour, weight, or an exact final price. |
| 6 | Recognition Rather Than Recall | 2 | Actions are labelled, but reused composite photography makes shoppers infer which texture belongs to each card. |
| 7 | Flexibility and Efficiency | 2 | Quick Add is fast, but there is no comparison/configuration path and its desktop affordance is hover-hidden. |
| 8 | Aesthetic and Minimalist Design | 3 | Strong hierarchy and restraint; very small uppercase utility copy reduces legibility. |
| 9 | Error Recovery | 2 | Errors appear in plain-language toasts, but recovery is generic and remote from the source. |
| 10 | Help and Documentation | 1 | Care and delivery links lead to unrelated sections, leaving purchase-critical help unavailable. |
| **Total** |  | **22/40** | **Acceptable — strong brand shell, major commerce-confidence gaps** |

All ten heuristics apply because this is an ecommerce storefront, not a campaign-only page.

## Design Specificity Verdict

**Visually specific, behaviorally generic.**

The blush–mauve–charcoal palette, Parfumerie lettering, blossom language, satin imagery, and disciplined editorial pacing feel authored for Hanami. The hero and “in bloom” motif create recognisable character.

Structurally, it still follows a transferable luxury template: split hero, manifesto, three-card grid, editorial split, abstract brand panel, newsletter. It could become fragrance, skincare, or jewellery with mostly asset and copy changes. The larger missed opportunity is that the interface becomes least hair-specific at the buying decision: it offers little visual or technical evidence distinguishing Silk Straight, Body Wave, and Deep Wave.

The deterministic detector returned a clean `[]` with zero rule or severity counts for `apps/web/src/App.tsx`. That means the page avoids the detector’s mechanical anti-patterns; it does not invalidate the interaction defects found through direct use. Browser testing additionally found drawer focus/keyboard escape failure, incorrect “1 items” accessible grammar, and misleading care/delivery destinations. There were no detector false positives.

No reliable user-visible overlay was created. The Browser’s evaluation surface was read-only, so mutable script injection was correctly skipped. Desktop screenshots, DOM/accessibility snapshots, computed layout state, and direct cart interactions were used as fallback evidence. Mobile visual inspection succeeded in Assessment A at 390×844; Assessment B’s independent viewport override did not apply and its mobile screenshot timed out, so no automated mobile pass is claimed.

## Overall Impression

The page wins the first five seconds and loses confidence at the buying decision. Its biggest opportunity is to make the commerce experience as exacting as the art direction: unique texture evidence, explicit configuration, and credible care/delivery reassurance.

Cognitive load is moderate: **2 of 8 checks fail**. This is not an overload problem; it is an under-information problem. Working memory suffers because each card reuses the same multi-texture composite, and progressive disclosure fails because required purchase options never appear. The emotional journey opens strongly, dips at the product grid, briefly recovers in the editorial story, then closes weakly when practical care and delivery promises lead nowhere.

## What’s Working

1. **The hero has genuine visual authority.** The asymmetrical split, charcoal field, blush CTA, and expressive display type feel expensive without defaulting to generic gold-and-serif luxury.
2. **The visual system is coherent.** Palette, line rules, hair photography, uppercase Manrope labels, and expressive typography repeat with discipline across sections, drawers, and footer.
3. **Core feedback is calm and clear.** Add-to-bag confirmation, bag count, quantity controls, subtotal, checkout busy copy, and newsletter success provide useful system status.

## Priority Issues

### [P1] Product imagery prevents texture comparison

**Why it matters:** Every card uses `/images/hair-collection.jpg` with only `objectPosition` changed. Each crop still includes multiple hair patterns, contradicting “Find your texture” and making the three products harder to distinguish.

**Fix:** Give each product a unique image showing only that texture, plus consistent detail imagery for the pattern, ends/weft, and model-worn result. Make the whole card open a product-detail surface.

**Suggested command:** `$impeccable shape`

### [P1] Quick Add adds an underspecified product

**Why it matters:** Cards show “From £95/£110/£125,” but Quick Add sends only slug and quantity. No length, bundle count, colour, weight, stock, or final-price decision exists, creating purchase anxiety and an ambiguous SKU.

**Fix:** Replace Quick Add with “Choose options” when variants are mandatory. Add a product page or compact option sheet with exact configuration, price, contents, care compatibility, and stock.

**Suggested command:** `$impeccable harden`

### [P1] Trust-building links are false affordances

**Why it matters:** “Read the care guide” and “Hair guide” open the newsletter; “Delivery & returns” jumps to the hero. These failures appear precisely when cautious buyers seek reassurance.

**Fix:** Create real care, delivery, and returns content or remove the promises until it exists. Surface concise delivery and return facts near purchase controls. Make the empty-cart action close the drawer and scroll to the collection.

**Suggested command:** `$impeccable clarify`

### [P2] The mobile hero delays the proposition and action

**Why it matters:** At 390×844, the image fills most of the first viewport and both CTAs remain below it. Mobile visitors see mood before they can identify the offer or act.

**Fix:** Reduce media height to roughly 52–58svh, let the value proposition and primary CTA enter the first viewport, or overlay a compact category/value cue while preserving the deeper editorial imagery.

**Suggested command:** `$impeccable adapt`

### [P2] Functional accessibility and typography need a commerce pass

**Why it matters:** Opening the cart leaves focus on the obscured trigger and Escape does not close the drawer. The accessible bag label says “1 items.” Small blush-on-mauve microcopy is about 4.16:1, below AA for normal small text, and expressive faces slow functional reading.

**Fix:** Treat the cart as a true dialog with focus transfer, focus containment, Escape close, and focus restoration. Pluralise the accessible label. Increase small functional text and contrast; reserve Parfumerie for emotional display moments.

**Suggested command:** `$impeccable audit`

## Persona Red Flags

**Jordan — Confused First-Timer:** The collection asks Jordan to choose a texture while every card image contains several textures. “From £110” does not explain what is included, and Quick Add commits before configuration. The promised care and delivery information then leads elsewhere, so trust collapses before checkout.

**Riley — Deliberate Stress Tester:** Riley finds promise/action mismatches immediately, loses the cart on refresh because it only exists in component state, and cannot verify the SKU beyond slug and quantity. Keyboard testing also reveals that the cart drawer neither receives focus nor closes with Escape.

**Casey — Distracted Mobile User:** Casey spends the first mobile viewport on photography before reaching the proposition or CTA. Quick Add and the bottom checkout control are thumb-friendly, but an interruption or reload clears the bag, and practical reassurance arrives too late.

## Minor Observations

- The hero note says “Signature body wave” over imagery that reads closer to straight hair.
- Desktop Quick Add is hidden until hover/focus and the product card itself is not clickable.
- The hero’s 820px minimum height pushes “Scroll to discover” below a common 1280×720 viewport.
- “The Hanami standard” and “Our standard” are used interchangeably.
- The announcement’s free-delivery promise converts; “Quiet luxury, made to move” adds mood but little information.
- Cart rows repeat “Body Wave” as both texture and product name without clarifying the configuration.
- Product reviews, sourcing proof, dimensions, weight, longevity evidence, and return facts are absent.

## Questions to Consider

1. Is Hanami meant to behave primarily as a luxury campaign or a luxury store? If it is a store, why is the commerce layer less specific than the art direction?
2. What must a buyer know before confidently spending £110, and which facts must appear before “Add to bag”?
3. Which Hanami claim can be proved in a way a competing hair brand cannot copy by changing one adjective?
4. What would the mobile hero look like if the first viewport had to deliver image, category, value proposition, and action without sacrificing quietness?
