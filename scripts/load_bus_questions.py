#!/usr/bin/env python3
"""
Loads Kahoot-style multiple choice questions from BUS_Questions.txt into the
BusQuestion table of the SQLite database.

Format of BUS_Questions.txt (per non-comment line):
    Question | Correct Answer | Wrong A | Wrong B | Wrong C | Explanation

The script:
  1. Clears all existing BusQuestion entries (old Anki cards).
  2. Parses the new questions.
  3. Inserts them with distractors and an explanation.
"""
import csv
import sqlite3
import uuid
import os

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    txt_path = os.path.join(base_dir, 'BUS_Questions.txt')
    db_path = os.path.join(base_dir, 'server', 'prisma', 'dev.db')

    print(f"Reading questions from {txt_path}...")
    if not os.path.exists(txt_path):
        print(f"Error: {txt_path} not found!")
        return

    questions = []
    with open(txt_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            # Skip empty lines and section headers (start with #)
            if not line.strip() or line.strip().startswith('#'):
                continue
            # Split on the pipe separator
            parts = [p.strip() for p in line.split('|')]
            if len(parts) != 6:
                print(f"Warning: skipping malformed line (expected 6 fields, got {len(parts)}): {line[:60]}...")
                continue
            question, correct, d1, d2, d3, explanation = parts
            if not question or not correct:
                continue
            questions.append((question, correct, d1, d2, d3, explanation))

    print(f"Successfully parsed {len(questions)} questions.")

    if len(questions) == 0:
        print("Error: no questions found, aborting.")
        return

    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear existing questions (remove old Anki cards)
    print("Clearing existing BusQuestion entries...")
    cursor.execute("DELETE FROM BusQuestion")

    inserted = 0
    for q, correct, d1, d2, d3, explanation in questions:
        qid = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO BusQuestion (id, question, correctAnswer, distractor1, distractor2, distractor3, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (qid, q, correct, d1, d2, d3, explanation),
        )
        inserted += 1

    conn.commit()
    conn.close()
    print(f"Done. Inserted {inserted} new BusQuestion entries.")


if __name__ == '__main__':
    main()
