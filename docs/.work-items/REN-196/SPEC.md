# REN-196 — Product image selection order and deselection

## Outcome

Make the product media picker easy to correct: selected media is shown in
sequence, each selected item has a visible remove control, and the final
sequence is the order persisted to the product.

## Implementation contract

- Preserve the existing `MediaSelectModal` and `ProductMediaSelectSingle`
  flow, including upload and search behavior.
- Maintain selection as an ordered array. New selections append to the end;
  deselection removes only that media item.
- Add a selected-media strip/list in the modal. Each selected item shows its
  thumbnail, sequence number, and an accessible `×`/remove button.
- Allow sequence changes through explicit move controls (move up/move down)
  on each selected item. The first item cannot move up and the last item
  cannot move down.
- Prevent the remove/move controls from triggering the underlying media-card
  click handler.
- Keep the existing `onSelectionComplete` contract. The product form maps the
  final ordered items to `{ id, position }` and continues to update the
  product through the existing tRPC mutation.
- When the modal is reopened, initialize its working selection from the
  current `selectedMedia` prop so saved order and removals are reflected.
- Do not change database schema, upload behavior, media-library deletion, or
  unrelated selectors such as size-chart media beyond sharing the improved
  reusable modal behavior.

## Verification

- A selected item can be removed with the visible remove button and no longer
  appears in the selected list or saved payload.
- Selected items retain insertion order by default and can be moved up/down;
  the saved positions are contiguous starting at 1.
- Clicking remove or move does not toggle the underlying card selection.
- Reopening the picker reflects the latest selection order.
- Existing upload, search, single-select, cancel, and done behavior remains
  intact.
