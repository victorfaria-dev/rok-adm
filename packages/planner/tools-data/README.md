# tools-data (wave D, F-81)

Hand-authored inputs for the calculators and R1 player pages under `/tools/`, `/glossary/` and `/changes/`.
Same rule as `data/budget-inputs.json`: no game number without a card.

`test/tools-data.test.ts` walks every `*.json` here and fails when:

- a fact id (`A01-0001` style) does not exist in `research/facts`;
- an `evidence` object (`{ "<fact id>": "<literal substring>" }`) names text that is not in that card;
- an object with a numeric `value` has no `facts` and is not marked `"pending": true`.

Values the cards do not cover are `"pending": true` (shown as "Pending measurement" and editable). Never invent them.
