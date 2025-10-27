import os
import io
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import matplotlib
matplotlib.use("Agg")  # ✅ Prevent Tkinter thread errors
import matplotlib.pyplot as plt

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Allow all origins for testing

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
quiz_data = {}
CATEGORIES = ["java", "c", "python", "gk"]


def load_questions():
    """Load all CSVs into memory."""
    global quiz_data
    quiz_data = {}

    print("=== Loading Quiz Files ===")
    for category in CATEGORIES:
        try:
            filename = os.path.join(BASE_DIR, f"{category}.csv")
            if not os.path.exists(filename):
                print(f"⚠️ Missing file: {filename}")
                quiz_data[category] = {"questions": [], "attempts": []}
                continue

            df = pd.read_csv(filename)
            df = df.sample(frac=1).reset_index(drop=True)  # shuffle rows

            temp_questions = []
            for i, row in df.iterrows():
                options = [
                    str(row["option1"]),
                    str(row["option2"]),
                    str(row["option3"]),
                    str(row["option4"]),
                ]
                np.random.shuffle(options)

                temp_questions.append({
                    "id": f"{category}_{i}",
                    "question": str(row["question"]),
                    "options": options,
                    "answer": str(row["answer"]),
                })

            quiz_data[category] = {"questions": temp_questions, "attempts": []}
            print(f"✅ Loaded {len(temp_questions)} questions from {filename}")

        except Exception as e:
            print(f"❌ Error loading {category}.csv: {e}")

    print("✅ Categories available:", list(quiz_data.keys()))
    print("===========================")


@app.route("/")
def home():
    return jsonify({"message": "Quiz API is running!"})


@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify(list(quiz_data.keys()))


@app.route("/api/questions", methods=["GET"])
def get_questions():
    category = request.args.get("category", "").lower()
    if not category or category not in quiz_data:
        return jsonify({"error": "Invalid category"}), 400

    questions = quiz_data[category]["questions"]
    return jsonify([
        {"id": q["id"], "question": q["question"], "options": q["options"]}
        for q in questions
    ])


@app.route("/api/submit", methods=["POST"])
def submit_answer():
    data = request.json
    category = data.get("category")
    question_id = str(data.get("question_id"))
    user_answer = str(data.get("user_answer"))

    if not category or category not in quiz_data:
        return jsonify({"error": "Invalid category"}), 400

    try:
        q = next(x for x in quiz_data[category]["questions"] if x["id"] == question_id)
        correct = (user_answer == q["answer"])

        quiz_data[category]["attempts"].append({
            "question_text": q["question"],
            "is_correct": correct,
            "time_taken": data.get("time_taken", 0)
        })

        msg = "Correct!" if correct else f"Incorrect. Correct: {q['answer']}"
        return jsonify({
            "correct": correct,
            "correct_answer": q["answer"],
            "message": msg
        })
    except StopIteration:
        return jsonify({"error": "Question not found"}), 404


@app.route("/api/stats", methods=["GET"])
def get_stats():
    category = request.args.get("category", "").lower()
    if not category or category not in quiz_data:
        return jsonify({"error": "Invalid category"}), 400

    attempts = quiz_data[category]["attempts"]
    if not attempts:
        return jsonify({"error": "No attempts yet"}), 400

    total = len(attempts)
    correct = sum(1 for a in attempts if a["is_correct"])
    incorrect = total - correct

    plt.figure(figsize=(5, 5))
    plt.pie(
        [correct, incorrect],
        labels=["Correct", "Incorrect"],
        autopct="%1.1f%%",
        colors=["#4ade80", "#f87171"]
    )
    plt.title(f"Performance in {category.upper()}", fontsize=14)

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", transparent=True)
    buf.seek(0)
    plt.close()
    return send_file(buf, mimetype="image/png")


# ✅ Load questions at startup (for Render)
load_questions()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
