const generatePaperBtn = document.getElementById("generatePaperBtn");
generatePaperBtn.disabled = true;
let countdownCompleted = false;

generatePaperBtn.addEventListener("click", async function () {
    if (!countdownCompleted) {
    alert("Please wait until the 5-minute countdown is completed.");
    return;
}

    const fingerprintStatus =
        document.getElementById("fingerprintStatus").textContent;

    const rtcStatus =
        document.getElementById("rtcStatus").textContent;

    const espStatus =
        document.getElementById("espStatus").textContent;

    if (
        !fingerprintStatus.includes("Verified") ||
        !rtcStatus.includes("Verified") ||
        !espStatus.includes("Connected")
    ) {
        alert(
            "Security verification incomplete. Please verify Fingerprint, RTC and ESP32 first."
        );
        return;
    }

    const subject = document.getElementById("subject").value;
    const questions = document.getElementById("questions").value;
    const totalQuestions = parseInt(questions);
    const difficulty = document.getElementById("difficulty").value;
    const duration = document.getElementById("duration").value;

    

    if (subject === "" || questions === "" || difficulty === "" || duration === "") {
        alert("Please select all the details first.");
        return;
    }
      // Get randomly generated questions from backend

    let selectedQuestions = [];

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/generate-paper"
        );

        const data = await response.json();

        if (data.status !== "success") {

            alert("Paper generate nahi hua: " + data.message);

            return;
        }

   selectedQuestions = data.questions.slice(
    0,
    totalQuestions
);


const encryptResponse = await fetch(
    "http://127.0.0.1:5000/api/encrypt-paper",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            questions: selectedQuestions
        })
    }
);

const encryptData = await encryptResponse.json();

if (encryptData.status !== "success") {
    alert("Paper encryption failed!");
    return;
}

console.log("Encrypted Paper:", encryptData.encrypted_paper);

const releaseResponse = await fetch(
    "http://127.0.0.1:5000/api/release-paper",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fingerprint_id: "FP001"
        })  
    }
);

const releaseData = await releaseResponse.json();

console.log("Release Response:", releaseData);

const releaseStatus = document.createElement("div");

releaseStatus.id = "releaseStatus";

releaseStatus.style.marginTop = "20px";
releaseStatus.style.padding = "15px";
releaseStatus.style.borderRadius = "10px";
releaseStatus.style.textAlign = "center";
releaseStatus.style.fontWeight = "600";
releaseStatus.style.fontSize = "16px";
releaseStatus.style.background = "#dcfce7";
releaseStatus.style.color = "#166534";
releaseStatus.style.border = "1px solid #86efac";

if (releaseData.status === "success") {
    releaseStatus.innerHTML = `
        <div>
            🔐 <strong>Secure Paper Status:</strong> Paper Released Successfully
        </div>
    `;
} else {
    releaseStatus.innerHTML = `
        <div>
            🔒 <strong>Secure Paper Status:</strong> ${releaseData.message}
        </div>
    `;
}

document.querySelector(".generator").appendChild(releaseStatus);

if (releaseData.status === "success") {

    selectedQuestions = releaseData.paper
    .split("\n")
    .map(line => line.replace(/^\d+\.\s*/, "").trim())
    .filter(line => line !== "");

    console.log(
        "✅ Question paper released:",
        releaseData.paper
    );

    const releasedQuestions = document.createElement("div");

releasedQuestions.className = "released-paper";

releasedQuestions.innerHTML = `
    <h3>🔓 Released Question Paper</h3>
    <ol>
        ${selectedQuestions.map(question => `
            <li>${question}</li>
        `).join("")}
    </ol>
`;

document.body.appendChild(releasedQuestions);

} else {

    console.log(
        "🔒 Paper not released:",
        releaseData.message
    );

    alert("Question paper release nahi hua: " + releaseData.message);
    return;
}

 

        console.log(
            "Backend se generated questions:",
            selectedQuestions
        );

    } catch (error) {

        console.error("Backend Error:", error);

        alert(
            "Backend se question paper generate nahi ho pa raha."
        );

        return;
    }

    const paper = document.createElement("div");

    paper.className = "generated-paper";

    paper.innerHTML = `
        <h2>🔐 AI Generated Secure Question Paper</h2>

<div class="secure-badge">
    🔒 ENCRYPTED & SECURE
</div>
<div class="paper-timer">
    ⏱️ Time Remaining:
    <span id="paperExamTimer">00:00</span>
</div>

        <div class="paper-info">
        <p><strong>Student Name:</strong> ${document.getElementById("studentName").value}</p>
        <p><strong>Roll Number:</strong> ${document.getElementById("rollNumber").value}</p>
            <p><strong>Institute:</strong> Govt. Polytechnic Kotdwara</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Total Questions:</strong> ${questions}</p>
            <p><strong>Difficulty:</strong> ${difficulty}</p>
            <p><strong>Duration:</strong> ${duration}</p>
           <p><strong>Total Marks:</strong> ${totalQuestions * 5}</p>
        </div>
<div class="exam-instructions">
    <h3>Instructions</h3>
    <ul>
        <li>Read all questions carefully.</li>
        <li>Attempt all questions.</li>
        <li>Do not leave the examination screen during the exam.</li>
        <li>Submit the examination before the time expires.</li>
    </ul>
</div>
        <hr>

 <h3>Question Paper</h3>

<ol>
    ${selectedQuestions.map((question) => `
        <li>
            <p>${question}</p>
            <textarea class="answer-box" placeholder="Write your answer here..."></textarea>
        </li>
    `).join("")}
</ol>

       
<button id="startExamBtn">
    ▶ Start Exam
</button>

        <div class="paper-footer">
            <p><strong>Generated by:</strong> AI Secure Exam System</p>
            <p>🔐 Secure Question Paper</p>
        </div>
        <button id="submitGeneratedExamBtn">
    ✅ Submit Examination
</button>

<div id="generatedExamResult"></div>
    `;

    const oldPaper = document.querySelector(".generated-paper");

    if (oldPaper) {
        oldPaper.remove();
    }

    document.querySelector(".generator").appendChild(paper);
    const submitGeneratedExamBtn = paper.querySelector("#submitGeneratedExamBtn");
const generatedExamResult = paper.querySelector("#generatedExamResult");

submitGeneratedExamBtn.addEventListener("click", function () {

    const confirmSubmit = confirm(
        "Are you sure you want to submit the examination?"
    );

    if (!confirmSubmit) {
        return;
    }

    clearInterval(examTimerInterval);

  generatedExamResult.innerHTML = `
    <h3>✅ Examination Submitted Successfully</h3>
    <p>Your examination has been submitted successfully.</p>
    <p><strong>Student:</strong> ${document.getElementById("studentName").value}</p>
    <p><strong>Roll Number:</strong> ${document.getElementById("rollNumber").value}</p>
`;

generatedExamResult.style.color = "#16a34a";

const answerBoxes = paper.querySelectorAll(".answer-box");

answerBoxes.forEach(function (box) {
    box.disabled = true;
});

    submitGeneratedExamBtn.disabled = true;
    submitGeneratedExamBtn.textContent = "Exam Submitted";

    const studentName = document.getElementById("studentName").value;
const rollNumber = document.getElementById("rollNumber").value;

const answers = [];

answerBoxes.forEach(function (box, index) {
    answers.push({
        question: selectedQuestions[index],
        answer: box.value
    });
});

fetch("http://127.0.0.1:5000/api/submit-exam", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        student_name: studentName,
        roll_number: rollNumber,
        questions: selectedQuestions,
        answers: answers
    })
})
.then(response => response.json())
.then(data => {
    console.log("Exam Submission:", data);
})
.catch(error => {
    console.error("Submission Error:", error);
});
});
    const startExamBtn = paper.querySelector("#startExamBtn");

startExamBtn.addEventListener("click", function () {

    const duration = document.getElementById("duration").value;

    if (duration === "") {
        alert("Please select exam duration first.");
        return;
    }

    if (duration === "30 Minutes") {
        examTimeLeft = 30 * 60;
    }
    else if (duration === "60 Minutes") {
        examTimeLeft = 60 * 60;
    }
    else if (duration === "90 Minutes") {
        examTimeLeft = 90 * 60;
    }
    else if (duration === "120 Minutes") {
        examTimeLeft = 120 * 60;
    }

    startExamTimer();

    paper.classList.add("exam-mode");

    paper.scrollIntoView({
        behavior: "smooth"
    });

});


// Automatically start exam after paper generation
startExamBtn.click();

let examTimeLeft = 30 * 60;
let examTimerInterval;

function startExamTimer() {

    clearInterval(examTimerInterval);

    examTimerInterval = setInterval(function () {

        const minutes = Math.floor(examTimeLeft / 60);
        const seconds = examTimeLeft % 60;

        document.getElementById("paperExamTimer").textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");

 if (examTimeLeft <= 0) {

    clearInterval(examTimerInterval);

    document.getElementById("paperExamTimer").textContent = "00:00";

    const submitButton = document.querySelector("#submitGeneratedExamBtn");
    const result = document.querySelector("#generatedExamResult");
    const answerBoxes = document.querySelectorAll(".answer-box");

    answerBoxes.forEach(function (box) {
        box.disabled = true;
    });

    if (submitButton && result) {

        result.innerHTML = `
            <h3>⏰ Examination Time Over</h3>
            <p>Your examination has been automatically submitted.</p>
            <p><strong>Student:</strong> ${document.getElementById("studentName").value}</p>
            <p><strong>Roll Number:</strong> ${document.getElementById("rollNumber").value}</p>
        `;

        result.style.color = "#dc2626";

        submitButton.disabled = true;
        submitButton.textContent = "Exam Automatically Submitted";
    }

    alert("Exam time is over. Your examination has been automatically submitted.");
}

        examTimeLeft--;

    }, 1000);
}

paper.scrollIntoView({
    behavior: "smooth"
});
});
// Security Verification

async function verifyFingerprint() {
    const status = document.getElementById("fingerprintStatus");

    status.textContent = "⏳ Verifying Fingerprint...";
    status.style.color = "#ca8a04";

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/fingerprint",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fingerprint_id: "FP001"
                })
            }
        );

        const data = await response.json();

        if (data.status === "success" && data.authenticated === true) {
            status.textContent = "✓ Fingerprint Verified";
            status.style.color = "#16a34a";

            checkExamAccess();
        } else {
            status.textContent = "✗ Fingerprint Verification Failed";
            status.style.color = "#dc2626";
        }

    } catch (error) {
        console.error("Fingerprint Error:", error);

        status.textContent = "✗ Fingerprint Backend Connection Failed";
        status.style.color = "#dc2626";
    }
}

async function verifyRTC() {
    const status = document.getElementById("rtcStatus");

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/exam-status"
        );

        const data = await response.json();

        if (data.exam_started) {
            status.textContent = "✓ Time Verified";
            status.style.color = "#16a34a";
            checkExamAccess();
        } else {
            status.textContent = "✗ Exam Time Not Reached";
            status.style.color = "#dc2626";
        }

    } catch (error) {
        status.textContent = "✗ RTC Backend Connection Failed";
        status.style.color = "#dc2626";
        console.error(error);
    }
}

async function connectESP32() {
    const status = document.getElementById("espStatus");

    status.textContent = "⏳ Connecting to ESP32...";
    status.style.color = "#ca8a04";

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/esp32-receive",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    device_id: "ESP32-001"
                })
            }
        );

        const data = await response.json();

        if (data.status === "success" && data.device_verified === true) {
            status.textContent = "✓ ESP32 Connected";
            status.style.color = "#16a34a";

            checkExamAccess();
        } else {
            status.textContent = "✗ ESP32 Verification Failed";
            status.style.color = "#dc2626";
        }

    } catch (error) {
        console.error("ESP32 Error:", error);

        status.textContent = "✗ ESP32 Backend Connection Failed";
        status.style.color = "#dc2626";
    }
}

function checkExamAccess() {

    const fingerprint = document.getElementById("fingerprintStatus").textContent;
    const rtc = document.getElementById("rtcStatus").textContent;
    const esp = document.getElementById("espStatus").textContent;

    if (
        fingerprint.includes("Verified") &&
        rtc.includes("Verified") &&
        esp.includes("Connected")
    ) {
        document.getElementById("accessStatus").textContent =
            "🔓 Exam Access Granted";

        document.querySelector(".access-box p").textContent =
            "All security verification steps completed successfully.";

            startTimerBtn.disabled = false;
timerMessage.textContent =
    "✓ Security verification complete. You can start the exam countdown.";
    }
}
// Student Verification

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", function () {

    const name = document.getElementById("studentName").value.trim();
    const roll = document.getElementById("rollNumber").value.trim();
    const status = document.getElementById("loginStatus");

    if (name === "" || roll === "") {
        status.textContent = "Please enter your name and roll number.";
        status.style.color = "#dc2626";
        return;
    }

    status.textContent = "✓ Student Verified";
    status.style.color = "#16a34a";

});

// Backend Controlled 5-Minute Exam Countdown

let timerInterval;

const startTimerBtn = document.getElementById("startTimerBtn");
const timerDisplay = document.getElementById("timer");
const timerMessage = document.getElementById("timerMessage");

startTimerBtn.disabled = true;

async function checkExamTime() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/exam-status"
        );

        const data = await response.json();

        if (data.status !== "success") {
            timerMessage.textContent =
                "Unable to check exam time.";
            return;
        }

        // Exam time has arrived
        if (data.exam_started === true) {

            startTimerBtn.disabled = false;

            timerMessage.textContent =
                "✓ Exam time reached. You can start the 5-minute countdown.";

            return;
        }

        // Exam has not started
        const remainingSeconds = data.remaining_seconds;

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        timerDisplay.textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");

        timerMessage.textContent =
            "⏳ Waiting for scheduled exam time...";

    } catch (error) {

        console.error("Exam Status Error:", error);

        timerMessage.textContent =
            "Backend se exam time check nahi ho pa raha.";
    }
}


// Check backend exam time every second
setInterval(checkExamTime, 1000);


// Initial check
checkExamTime();


// Start 5-minute countdown
startTimerBtn.addEventListener("click", function () {

    startTimerBtn.disabled = true;

    let timeLeft = 1 * 60;

    timerInterval = setInterval(function () {

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        timerDisplay.textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            timerDisplay.textContent = "00:00";

            countdownCompleted = true;

            timerMessage.textContent =
                "✓ 5-minute countdown complete. Generating question paper...";

            // Automatically generate the paper
            generatePaperBtn.disabled = false;
            generatePaperBtn.click();
            generatePaperBtn.disabled = true;

            return;
        }

        timeLeft--;

    }, 1000);

});

// Show student details on exam screen

const studentNameInput = document.getElementById("studentName");
const rollNumberInput = document.getElementById("rollNumber");

const examStudentName = document.getElementById("examStudentName");
const examRollNumber = document.getElementById("examRollNumber");

if (studentNameInput && rollNumberInput) {

    loginBtn.addEventListener("click", function () {

        const name = studentNameInput.value.trim();
        const roll = rollNumberInput.value.trim();

        if (name !== "" && roll !== "") {

            examStudentName.textContent = name;
            examRollNumber.textContent = roll;

        }

    });
}
// Submit Examination

const submitExamBtn = document.getElementById("submitExamBtn");
const examResult = document.getElementById("examResult");

submitExamBtn.addEventListener("click", function () {

    const confirmSubmit = confirm(
        "Are you sure you want to submit the examination?"
    );

    if (!confirmSubmit) {
        return;
    }

    examResult.textContent =
        "✓ Examination submitted successfully.";

    examResult.style.color = "#16a34a";

    submitExamBtn.disabled = true;
    submitExamBtn.textContent = "Exam Submitted";
});

// Backend Connection Test

fetch("http://127.0.0.1:5000/api/status")
    .then(response => response.json())
    .then(data => {
        console.log("Backend Response:", data);
    })
    .catch(error => {
        console.error("Backend Connection Error:", error);
    });

    document.getElementById("viewSubmissionsBtn").addEventListener("click", async function () {

    const container = document.getElementById("submissionsContainer");

    container.innerHTML = "<p>Loading submissions...</p>";

    try {
        const response = await fetch("http://127.0.0.1:5000/api/submissions");
        const data = await response.json();

        if (data.status !== "success") {
            container.innerHTML = "<p>Unable to load submissions.</p>";
            return;
        }

        if (data.submissions.length === 0) {
            container.innerHTML = "<p>No submissions found.</p>";
            return;
        }

        container.innerHTML = "";

        data.submissions.forEach(function (submission, index) {

            let answersHTML = "";

            submission.answers.forEach(function (item, answerIndex) {
                answersHTML += `
                    <div>
                        <p>
                            <strong>Q${answerIndex + 1}:</strong>
                            ${item.question}
                        </p>
                        <p>
                            <strong>Answer:</strong>
                            ${item.answer || "No answer"}
                        </p>
                    </div>
                    <hr>
                `;
            });

            container.innerHTML += `
                <div class="submission-card">
                    <h3>Submission ${index + 1}</h3>

                    <p>
                        <strong>Student:</strong>
                        ${submission.student_name}
                    </p>

                    <p>
                        <strong>Roll Number:</strong>
                        ${submission.roll_number}
                    </p>

                    <p>
                        <strong>Submission Time:</strong>
                        ${submission.submission_time}
                    </p>

                    <h4>Questions & Answers</h4>

                    ${answersHTML}
                </div>
            `;
        });

    } catch (error) {
        console.error("Submission Loading Error:", error);
        container.innerHTML = "<p>Backend connection failed.</p>";
    }
});
