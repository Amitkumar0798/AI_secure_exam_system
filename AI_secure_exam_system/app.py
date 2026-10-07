from flask import Flask, jsonify
from flask_cors import CORS
from pypdf import PdfReader
import os
import json
from cryptography.fernet import Fernet
from datetime import datetime

app = Flask(__name__)
CORS(app)

QUESTION_PAPERS_FOLDER = "question_papers"

# Encryption key
ENCRYPTION_KEY = Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

LAST_ENCRYPTED_PAPER = None

# Exam schedule
EXAM_DATE = "2026-10-02"
EXAM_TIME = "11:32"

@app.route("/")
def home():
    return "AI Secure Exam System Backend is Running!"


@app.route("/api/status")
def api_status():
    return jsonify({
        "status": "success",
        "message": "Backend connected successfully!"
    })


@app.route("/api/papers")
def get_papers():
    papers = []

    if os.path.exists(QUESTION_PAPERS_FOLDER):
        for file in os.listdir(QUESTION_PAPERS_FOLDER):
            if file.lower().endswith(".pdf"):
                file_path = os.path.join(QUESTION_PAPERS_FOLDER, file)

                try:
                    reader = PdfReader(file_path)

                    text = ""

                    for page in reader.pages:
                        page_text = page.extract_text()

                        if page_text:
                            text += page_text + "\n"

                    papers.append({
                        "name": file,
                        "pages": len(reader.pages),
                        "content": text
                    })

                except Exception as e:
                    papers.append({
                        "name": file,
                        "error": str(e)
                    })

    return jsonify({
        "status": "success",
        "papers": papers,
        "total": len(papers)
    })

@app.route("/api/select-paper")
def select_paper():
    import random

    pdf_files = []

    if os.path.exists(QUESTION_PAPERS_FOLDER):
        for file in os.listdir(QUESTION_PAPERS_FOLDER):
            if file.lower().endswith(".pdf"):
                pdf_files.append(file)

    if not pdf_files:
        return jsonify({
            "status": "error",
            "message": "No question papers found."
        }), 404

    selected_paper = random.choice(pdf_files)

    return jsonify({
        "status": "success",
        "selected_paper": selected_paper,
        "message": "Question paper selected successfully!"
    })

@app.route("/api/encrypt-paper", methods=["POST"])
def encrypt_paper():
    from flask import request

    data = request.get_json()

    if not data or "questions" not in data:
        return jsonify({
            "status": "error",
            "message": "No questions received."
        }), 400

    questions = data["questions"]

    paper_text = "\n".join(
        f"{i+1}. {question}"
        for i, question in enumerate(questions)
    )

    encrypted_data = cipher.encrypt(
        paper_text.encode()
    ).decode()

    global LAST_ENCRYPTED_PAPER
    LAST_ENCRYPTED_PAPER = encrypted_data

    return jsonify({

        "status": "success",
        "message": "Question paper encrypted successfully!",
        "encrypted_paper": encrypted_data
    })



@app.route("/api/encrypted-paper")
def get_encrypted_paper():

    if LAST_ENCRYPTED_PAPER is None:
        return jsonify({
            "status": "error",
            "message": "No encrypted paper available."
        }), 404

    return jsonify({
        "status": "success",
        "encrypted_paper": LAST_ENCRYPTED_PAPER
    })

@app.route("/api/decrypt-paper")
def decrypt_paper():

    if LAST_ENCRYPTED_PAPER is None:
        return jsonify({
            "status": "error",
            "message": "No encrypted paper available."
        }), 404

    try:
        decrypted_data = cipher.decrypt(
            LAST_ENCRYPTED_PAPER.encode()
        ).decode()

        return jsonify({
            "status": "success",
            "message": "Question paper decrypted successfully!",
            "decrypted_paper": decrypted_data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/generate-paper")
def generate_paper():
    import random

    all_questions = []

    if not os.path.exists(QUESTION_PAPERS_FOLDER):
        return jsonify({
            "status": "error",
            "message": "Question papers folder not found."
        }), 404

    pdf_files = []

    for file in os.listdir(QUESTION_PAPERS_FOLDER):
        if file.lower().endswith(".pdf"):
            pdf_files.append(file)

    if not pdf_files:
        return jsonify({
            "status": "error",
            "message": "No question papers found."
        }), 404

    try:
        import re

        # Read questions from every PDF
        for file in pdf_files:

            file_path = os.path.join(
                QUESTION_PAPERS_FOLDER,
                file
            )

            reader = PdfReader(file_path)

            for page in reader.pages:

                page_text = page.extract_text()

                if page_text:

                    lines = page_text.split("\n")

                    for line in lines:

                        line = line.strip()

                        # Only take actual numbered questions
                        match = re.match(r"^(10|[1-9])[.)]?\s+(.+)$", line)

                        if match:
                            question = match.group(2).strip()

                            all_questions.append(question)

        # Remove duplicate questions
        all_questions = list(set(all_questions))

        if not all_questions:
            return jsonify({
                "status": "error",
                "message": "No questions could be extracted from PDFs."
            }), 500

        # Select random questions
        number_of_questions = min(10, len(all_questions))

        selected_questions = random.sample(
            all_questions,
            number_of_questions
        )

        return jsonify({
            "status": "success",
            "message": "New question paper generated successfully!",
            "total_questions": number_of_questions,
            "questions": selected_questions
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500



@app.route("/api/release-paper", methods=["POST"])
def release_paper():

    from flask import request

    # Receive fingerprint ID
    data = request.get_json()

    if not data or "fingerprint_id" not in data:
        return jsonify({
            "status": "error",
            "message": "Fingerprint ID not received."
        }), 400

    fingerprint_id = data["fingerprint_id"]

    # Authorized fingerprint
    authorized_fingerprint = "FP001"

    # Check fingerprint
    if fingerprint_id != authorized_fingerprint:
        return jsonify({
            "status": "failed",
            "message": "Fingerprint verification failed."
        }), 401

    # Current time
    now = datetime.now()

    # Exam date and time
    exam_datetime = datetime.strptime(
        EXAM_DATE + " " + EXAM_TIME,
        "%Y-%m-%d %H:%M"
    )

    # Check exam time
    if now < exam_datetime:
        remaining_seconds = int(
            (exam_datetime - now).total_seconds()
        )

        return jsonify({
            "status": "locked",
            "message": "Paper is locked. Exam time has not arrived.",
            "remaining_seconds": remaining_seconds
        }), 403

    # Check encrypted paper
    if LAST_ENCRYPTED_PAPER is None:
        return jsonify({
            "status": "error",
            "message": "No encrypted paper available."
        }), 404

    try:
        decrypted_data = cipher.decrypt(
            LAST_ENCRYPTED_PAPER.encode()
        ).decode()

        return jsonify({
            "status": "success",
            "message": "Fingerprint verified. Question paper released successfully!",
            "paper": decrypted_data
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/exam-status")
def exam_status():

    now = datetime.now()

    exam_datetime = datetime.strptime(
        EXAM_DATE + " " + EXAM_TIME,
        "%Y-%m-%d %H:%M"
    )

    if now >= exam_datetime:
        return jsonify({
            "status": "success",
            "exam_started": True,
            "message": "Exam time reached. Paper can be released."
        })

    remaining_seconds = int(
        (exam_datetime - now).total_seconds()
    )

    return jsonify({
        "status": "success",
        "exam_started": False,
        "remaining_seconds": remaining_seconds,
        "message": "Exam has not started yet."
    }) 

@app.route("/api/fingerprint", methods=["POST"])
def fingerprint_authentication():
    from flask import request

    data = request.get_json()

    if not data or "fingerprint_id" not in data:
        return jsonify({
            "status": "error",
            "message": "Fingerprint ID not received."
        }), 400

    fingerprint_id = data["fingerprint_id"]

    # Demo authorized fingerprint
    authorized_fingerprint = "FP001"

    if fingerprint_id == authorized_fingerprint:
        return jsonify({
            "status": "success",
            "authenticated": True,
            "message": "Fingerprint verified successfully!"
        })

    return jsonify({
        "status": "failed",
        "authenticated": False,
        "message": "Fingerprint verification failed."
    }), 401

@app.route("/api/esp32-receive", methods=["POST"])
def esp32_receive():

    from flask import request

    data = request.get_json()

    if not data or "device_id" not in data:
        return jsonify({
            "status": "error",
            "message": "ESP32 device ID not received."
        }), 400

    device_id = data["device_id"]

    # Demo ESP32 device
    authorized_device = "ESP32-001"

    if device_id != authorized_device:
        return jsonify({
            "status": "failed",
            "message": "ESP32 device verification failed."
        }), 401

    return jsonify({
    "status": "success",
    "device_verified": True,
    "encrypted_paper": LAST_ENCRYPTED_PAPER,
    "message": "ESP32 verified successfully."
})

@app.route("/api/submit-exam", methods=["POST"])
def submit_exam():
    from flask import request
    from datetime import datetime

    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No examination data received."
        }), 400

    student_name = data.get("student_name")
    roll_number = data.get("roll_number")
    questions = data.get("questions")
    answers = data.get("answers")

    if not student_name or not roll_number:
        return jsonify({
            "status": "error",
            "message": "Student name or roll number missing."
        }), 400

    submission = {
        "student_name": student_name,
        "roll_number": roll_number,
        "questions": questions,
        "answers": answers,
        "submission_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    print("\n===== EXAM SUBMISSION =====")
    print(submission)
    print("===========================\n")

    file_name = "exam_submissions.json"

    if os.path.exists(file_name):
        with open(file_name, "r", encoding="utf-8") as file:
            submissions = json.load(file)
    else:
        submissions = []

    submissions.append(submission)

    with open(file_name, "w", encoding="utf-8") as file:
        json.dump(submissions, file, indent=4, ensure_ascii=False)

    return jsonify({
        "status": "success",
        "message": "Examination submitted successfully!",
        "submission": submission
    })

@app.route("/api/submissions")
def get_submissions():
    file_name = "exam_submissions.json"

    if not os.path.exists(file_name):
        return jsonify({
            "status": "success",
            "submissions": [],
            "total": 0
        })

    try:
        with open(file_name, "r", encoding="utf-8") as file:
            submissions = json.load(file)

        return jsonify({
            "status": "success",
            "submissions": submissions,
            "total": len(submissions)
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)

