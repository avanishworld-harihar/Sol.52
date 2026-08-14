"use client";

import styles from "./Field.module.css";
import { FIELD_DEFAULT_NOTES } from "./field-live";

type Props = {
  /** Sheet-specific notes appended after the set defaults. */
  extra?: string[];
};

export function GeneralNotes({ extra = [] }: Props) {
  const notes = [...FIELD_DEFAULT_NOTES, ...extra.filter((n) => n.trim())];
  return (
    <aside className={styles.generalNotes} aria-label="General notes">
      <div className={styles.generalNotesTitle}>GENERAL NOTES</div>
      <ol className={styles.generalNotesList}>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ol>
    </aside>
  );
}

export default GeneralNotes;
