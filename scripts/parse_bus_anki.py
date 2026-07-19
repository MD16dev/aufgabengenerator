#!/usr/bin/env python3
import csv
import re
import random
import sqlite3
import uuid
import os

def clean_html(text):
    # Strip image tags
    text = re.sub(r'<img[^>]*>', '', text)
    # Replace &nbsp; with space
    text = text.replace('&nbsp;', ' ')
    # Clean up double line breaks that might result from image removal
    text = re.sub(r'(<br\s*/?>\s*){3,}', '<br><br>', text)
    # Remove leading/trailing line breaks and whitespace
    text = text.strip()
    # Remove surrounding quotes if they are redundant
    if text.startswith('"') and text.endswith('"'):
        # Check if they are matched outer quotes
        inner = text[1:-1]
        if '"' not in inner:
            text = inner
    return text

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    txt_path = os.path.join(base_dir, 'BUS.txt')
    db_path = os.path.join(base_dir, 'server', 'prisma', 'dev.db')

    print(f"Reading from {txt_path}...")
    if not os.path.exists(txt_path):
        print(f"Error: {txt_path} not found!")
        return

    cards = []
    with open(txt_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for row in reader:
            if not row:
                continue
            # Skip comments or metadata
            if row[0].startswith('#'):
                continue
            if len(row) < 2:
                continue
            
            question = clean_html(row[0])
            answer = clean_html(row[1])
            
            if question and answer:
                cards.append({
                    'question': question,
                    'answer': answer
                })

    print(f"Successfully loaded {len(cards)} cards from Anki export.")

    if len(cards) < 4:
        print("Error: Not enough questions to generate 4-option multiple choice answers (need at least 4).")
        return

    # Extract all answers to use as distractors
    all_answers = [c['answer'] for c in cards]

    # Connect to the database
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear existing questions
    print("Clearing existing BusQuestion entries...")
    cursor.execute("DELETE FROM BusQuestion")

    # Insert cards with distractors
    inserted_count = 0
    for card in cards:
        q = card['question']
        correct = card['answer']

        # Get unique distractors from other questions' answers
        # Filter out answers that are the same as correct answer
        distractor_pool = list(set([ans for ans in all_answers if ans.lower().strip() != correct.lower().strip()]))
        
        if len(distractor_pool) < 3:
            print(f"Warning: Not enough distractors for question: {q[:50]}...")
            continue
            
        distractors = random.sample(distractor_pool, 3)

        question_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO BusQuestion (id, question, correctAnswer, distractor1, distractor2, distractor3)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (question_id, q, correct, distractors[0], distractors[1], distractors[2]))
        inserted_count += 1

    conn.commit()
    conn.close()

    print(f"Finished! Inserted {inserted_count} questions into the BusQuestion table.")

if __name__ == '__main__':
    main()
