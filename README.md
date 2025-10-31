# Welding Study Hub

The Welding Study Hub is a three-page, self-paced tracker that helps you stay on top of
welding theory, hands-on drills, and reflective journaling. The site runs entirely in the
browser and saves progress locally so you can close the tab and pick up where you left
off.

## Pages

### Readings (`index.html`)

- Review the curated reading checklist and add your own lessons with links, descriptions,
  and topic tags.
- Filter the checklist by topic or show only the custom lessons you have added.
- Track completion progress for every item; progress updates the dashboard cards at the
  top of every page.
- Use the **Jot a note** quick entry button to record a reflection without leaving the
  page. Entries are stored in the Notes journal.

### Practice (`practice.html`)

- Work through the structured drill list and toggle items to log completed reps.
- Completed practice entries contribute to your streak counter, which tracks consecutive
  days with at least one finished drill.
- Capture session insights with the **Capture a note** quick entry button to save to the
  Notes journal.

### Notes (`notes.html`)

- Add timestamped journal entries and review your saved reflections in reverse
  chronological order.
- Remove individual entries or clear the journal entirely; everything is stored locally.

## Local storage keys

The tracker persists information in `localStorage` using the following keys:

| Key                    | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `reading-progress`     | Completion state for each reading checklist item.                          |
| `practice-progress`    | Completion state for each practice drill.                                  |
| `custom-readings`      | User-added reading resources.                                              |
| `welding-note-entries` | Saved journal notes (new format).                                          |
| `welding-streak`       | JSON object containing the practice streak count and last completion date. |

Legacy notes saved under `welding-notes` are migrated automatically into the
`welding-note-entries` format the next time the site loads.

## Customisation tips

- To seed additional default readings or drills, edit the `trackerData` object in
  `app.js`.
- Styling lives in `styles.css`. Each page shares the same design tokens and layout
  components.
- Because progress is stored locally, clearing browser storage or visiting in a private
  window starts the tracker with fresh data.
