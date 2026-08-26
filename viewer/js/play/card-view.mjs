import { bindResolvedImage, getCardFamily } from "./art-resolver.mjs";
import { gameDetails, resolveCardTechnicalCopy } from "./technical-action-copy.mjs";

const VIEW_VARIANTS = new Set(["hand", "grid", "detail", "compact"]);

function requireDocument(documentRef) {
  if (!documentRef?.createElement) {
    throw new TypeError("Card views require a DOM Document.");
  }
  return documentRef;
}

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function element(documentRef, tagName, className, content = "") {
  const node = documentRef.createElement(tagName);
  if (className) {
    node.className = className;
  }
  if (content !== "") {
    node.textContent = String(content);
  }
  return node;
}

function titleOf(card) {
  return text(card?.presentation?.display_name, text(card?.id, "Unknown card"));
}

function cardIdentifier(card, cardInstanceId) {
  return text(cardInstanceId, text(card?.id));
}

function appendArtSlot(documentRef, root, card, artResolver, eager) {
  const slot = element(documentRef, "div", "play-card__art play-art-slot");
  slot.dataset.family = getCardFamily(card).key;
  const image = element(documentRef, "img", "play-card__art-image");
  image.width = 800;
  image.height = 450;
  const fallback = element(documentRef, "span", "play-card__art-fallback");
  fallback.setAttribute("aria-hidden", "true");
  fallback.append(element(documentRef, "span", "play-card__art-mark", getCardFamily(card).icon));
  slot.append(image, fallback);
  root.append(slot);

  try {
    const resolution = artResolver?.resolveCardArt?.(card);
    bindResolvedImage(image, resolution, { eager });
    if (resolution) {
      slot.dataset.assetKind = resolution.kind;
    }
  } catch {
    image.hidden = true;
    image.dataset.artStatus = "error";
    slot.dataset.assetKind = "fallback";
  }
}

function appendCardFace(documentRef, root, card, options) {
  const family = getCardFamily(card);
  const header = element(documentRef, "div", "play-card__header");
  const familyLabel = element(documentRef, "span", "play-card__family");
  const icon = element(documentRef, "span", "play-card__family-icon", family.icon);
  icon.setAttribute("aria-hidden", "true");
  familyLabel.append(icon, documentRef.createTextNode(family.label));
  const cost = element(documentRef, "span", "play-card__cost", card?.cost ?? "–");
  cost.setAttribute("aria-label", `${String(card?.cost ?? "Unknown")} Action cost`);
  header.append(familyLabel, cost);
  root.append(header);

  appendArtSlot(documentRef, root, card, options.artResolver, options.eagerArt);

  const body = element(documentRef, "div", "play-card__body");
  body.append(
    element(documentRef, "h3", "play-card__title", titleOf(card)),
    element(
      documentRef,
      "p",
      "play-card__rules",
      text(card?.presentation?.short_description, text(card?.rules_text, "No description available.")),
    ),
  );
  root.append(body);

  const footer = element(documentRef, "footer", "play-card__footer");
  footer.append(
    element(documentRef, "span", "play-card__disposition", text(card?.play_contract?.disposition, "card")),
    element(documentRef, "span", "play-card__id", text(card?.id, "unidentified")),
  );
  root.append(footer);
}

/**
 * Build a semantic card face. It displays caller-supplied state but never
 * decides whether a card can be played or constructs an engine intent.
 */
export function createCardView(card, {
  variant = "grid",
  interactive = false,
  selectable = interactive,
  selected = false,
  disabled = false,
  cardInstanceId = "",
  artResolver = null,
  eagerArt = false,
  onActivate = null,
  documentRef = globalThis.document,
} = {}) {
  const documentObject = requireDocument(documentRef);
  const normalizedVariant = VIEW_VARIANTS.has(variant) ? variant : "grid";
  const family = getCardFamily(card);
  const root = element(
    documentObject,
    interactive ? "button" : "article",
    `play-card play-card--${family.key} play-card--${normalizedVariant}`,
  );
  if (interactive) {
    root.type = "button";
    root.disabled = Boolean(disabled);
  }
  root.dataset.cardId = text(card?.id);
  root.dataset.cardInstanceId = text(cardInstanceId);
  root.dataset.family = family.key;
  root.dataset.selected = selected ? "true" : "false";
  if (selectable) {
    root.setAttribute("aria-pressed", selected ? "true" : "false");
  }
  root.setAttribute(
    "aria-label",
    `${titleOf(card)}, ${family.label}, ${String(card?.cost ?? "unknown")} Action cost`,
  );
  appendCardFace(documentObject, root, card, { artResolver, eagerArt });

  if (interactive && typeof onActivate === "function") {
    root.addEventListener("click", () => {
      onActivate(Object.freeze({
        cardId: text(card?.id),
        cardInstanceId: cardIdentifier(card, cardInstanceId),
      }));
    });
  }
  return root;
}

export function setCardViewState(cardView, {
  selected,
  legalTarget,
  resolving,
  rejected,
  disabled,
} = {}) {
  if (!cardView?.dataset) {
    return;
  }
  if (typeof selected === "boolean") {
    cardView.dataset.selected = String(selected);
    if (cardView.hasAttribute("aria-pressed")) {
      cardView.setAttribute("aria-pressed", String(selected));
    }
  }
  if (typeof legalTarget === "boolean") {
    cardView.dataset.legalTarget = String(legalTarget);
  }
  if (typeof resolving === "boolean") {
    cardView.dataset.resolving = String(resolving);
    cardView.setAttribute("aria-busy", String(resolving));
  }
  if (typeof rejected === "boolean") {
    cardView.dataset.rejected = String(rejected);
  }
  if (typeof disabled === "boolean" && "disabled" in cardView) {
    cardView.disabled = disabled;
  }
}

/**
 * Deck-editor wrapper. Quantity limits and legality remain caller projections;
 * this component only emits card ID plus requested delta.
 */
export function createDeckCardTile(card, {
  quantity = 0,
  canIncrement = true,
  canDecrement = quantity > 0,
  artResolver = null,
  onAdjust = null,
  onInspect = null,
  documentRef = globalThis.document,
} = {}) {
  const documentObject = requireDocument(documentRef);
  const wrapper = element(documentObject, "article", "deck-card-tile");
  wrapper.dataset.cardId = text(card?.id);
  wrapper.append(createCardView(card, {
    variant: "grid",
    artResolver,
    documentRef: documentObject,
  }));

  const controls = element(documentObject, "div", "deck-card-tile__controls");
  const decrement = element(documentObject, "button", "play-icon-button", "−");
  decrement.type = "button";
  decrement.dataset.continuityKey = `deck-card:${text(card?.id)}:decrement`;
  decrement.disabled = !canDecrement;
  decrement.setAttribute("aria-label", `Remove one ${titleOf(card)}`);
  const quantityOutput = element(documentObject, "output", "deck-card-tile__quantity", quantity);
  quantityOutput.setAttribute("aria-label", `${String(quantity)} copies of ${titleOf(card)}`);
  const increment = element(documentObject, "button", "play-icon-button", "+");
  increment.type = "button";
  increment.dataset.continuityKey = `deck-card:${text(card?.id)}:increment`;
  increment.disabled = !canIncrement;
  increment.setAttribute("aria-label", `Add one ${titleOf(card)}`);
  const inspect = element(documentObject, "button", "play-button play-button--quiet", "Inspect");
  inspect.type = "button";
  inspect.dataset.continuityKey = `deck-card:${text(card?.id)}:inspect`;
  inspect.setAttribute("aria-label", `Inspect ${titleOf(card)}`);
  controls.append(decrement, quantityOutput, increment, inspect);
  wrapper.append(controls);

  if (typeof onAdjust === "function") {
    decrement.addEventListener("click", () => onAdjust(Object.freeze({ cardId: card.id, delta: -1 })));
    increment.addEventListener("click", () => onAdjust(Object.freeze({ cardId: card.id, delta: 1 })));
  }
  if (typeof onInspect === "function") {
    inspect.addEventListener("click", () => onInspect(Object.freeze({ cardId: card.id })));
  }
  return wrapper;
}

export function createCardDetailView(card, {
  artResolver = null,
  domainById = null,
  diagnosticContext = null,
  handContext = null,
  documentRef = globalThis.document,
} = {}) {
  const documentObject = requireDocument(documentRef);
  const detail = element(documentObject, "article", "card-detail");
  detail.dataset.cardId = text(card?.id);
  detail.append(createCardView(card, {
    variant: "detail",
    artResolver,
    eagerArt: true,
    documentRef: documentObject,
  }));

  const copy = element(documentObject, "div", "card-detail__copy");
  const technical = resolveCardTechnicalCopy(card, domainById);
  const description = technical?.description || text(card?.presentation?.short_description);
  if (description) {
    copy.append(
      element(documentObject, "h4", "play-eyebrow", "What it does"),
      element(documentObject, "p", "card-detail__description", description),
    );
  }
  if (diagnosticContext) {
    copy.append(
      element(documentObject, "h4", "play-eyebrow", "Subsystem"),
      element(documentObject, "p", "card-detail__category", text(diagnosticContext.category, "Uncategorized")),
    );
    if (diagnosticContext.relevant) {
      copy.append(
        element(documentObject, "h4", "play-eyebrow", "Why relevant?"),
        element(documentObject, "p", "card-detail__relevance-path", text(diagnosticContext.path, "A public relationship marks this diagnostic as relevant.")),
        element(documentObject, "p", "card-detail__relevance-notice", text(diagnosticContext.notice, "Public relationship coverage may be incomplete.")),
      );
    } else {
      copy.append(
        element(documentObject, "h4", "play-eyebrow", "Global catalog availability"),
        element(documentObject, "p", "card-detail__catalog-note", text(
          diagnosticContext.catalogExplanation,
          "Global keeps the complete diagnostic catalog available. Not being marked relevant does not mean a diagnostic is useless or illegal.",
        )),
      );
    }
  }
  if (handContext) {
    const quantity = Math.max(1, Number(handContext.quantity) || 1);
    copy.append(
      element(documentObject, "h4", "play-eyebrow", "Current hand stack"),
      element(documentObject, "p", "card-detail__hand-quantity", `${quantity} ${quantity === 1 ? "copy" : "copies"} currently in hand.`),
    );
  }
  const educational = technical?.note || text(card?.educational_text);
  if (educational) {
    copy.append(
      element(documentObject, "h4", "play-eyebrow", technical?.noteLabel || "Interpretation note"),
      element(documentObject, "p", "card-detail__education", educational),
    );
  }

  if (technical?.method?.facts.length || technical?.method?.lists.length) {
    copy.append(element(documentObject, "h4", "play-eyebrow", "Technical method"));
    if (technical.method.facts.length) {
      const facts = element(documentObject, "dl", "card-detail__facts");
      for (const [label, value] of technical.method.facts) {
        const row = element(documentObject, "div", "card-detail__fact");
        row.append(element(documentObject, "dt", "", label), element(documentObject, "dd", "", value));
        facts.append(row);
      }
      copy.append(facts);
    }
    for (const [label, values] of technical.method.lists) {
      copy.append(element(documentObject, "h5", "card-detail__subheading", label));
      const list = element(documentObject, "ol", "card-detail__method-list");
      for (const value of values) list.append(element(documentObject, "li", "", value));
      copy.append(list);
    }
  }

  const gameplay = technical?.game || gameDetails(card);
  copy.append(element(documentObject, "h4", "play-eyebrow", "In this game"));
  const gameFacts = element(documentObject, "dl", "card-detail__facts card-detail__facts--game");
  for (const [label, value] of [
    ["Action cost", `${String(card?.cost ?? "Unknown")} Action${card?.cost === 1 ? "" : "s"}`],
    ["Target", gameplay.target],
    ["Prerequisite", gameplay.prerequisites],
    ["Result", gameplay.result],
    ["After use", gameplay.disposition],
  ]) {
    const row = element(documentObject, "div", "card-detail__fact");
    row.append(element(documentObject, "dt", "", label), element(documentObject, "dd", "", value));
    gameFacts.append(row);
  }
  copy.append(gameFacts);

  const fallbackReferences = [card?.primary_domain_reference, ...(card?.additional_domain_references ?? [])]
    .filter((reference) => text(reference?.entity_id))
    .map((reference) => ({ id: reference.entity_id, name: reference.entity_id, role: reference.role }));
  const references = technical?.references?.length ? technical.references : fallbackReferences;
  if (references.length > 0) {
    copy.append(element(documentObject, "h4", "play-eyebrow", "Technical references"));
    const list = element(documentObject, "ul", "card-detail__references");
    for (const reference of references) {
      const item = element(documentObject, "li", "card-detail__reference");
      const name = element(documentObject, reference.href ? "a" : "span", "card-detail__reference-name", reference.name);
      if (reference.href) name.href = reference.href;
      item.append(name, element(documentObject, "span", "card-detail__reference-role", text(reference.role, "Reference")));
      list.append(item);
    }
    copy.append(list);
  }
  const advanced = element(documentObject, "details", "card-detail__advanced");
  advanced.append(element(documentObject, "summary", "", "Advanced IDs and authored game text"));
  advanced.append(
    element(documentObject, "code", "card-detail__reference-id", text(card?.primary_domain_reference?.entity_id)),
    element(documentObject, "p", "card-detail__rules-text", text(card?.rules_text)),
  );
  copy.append(advanced);
  detail.append(copy);
  return detail;
}
