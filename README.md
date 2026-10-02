# 🌊 SeaGuard AI – Maritime Emergency, Security & Incident Management System

SeaGuard AI is an intelligent multi-agent system designed to support maritime emergency response, security management, incident analysis, and regulatory information retrieval.

The system combines **Artificial Intelligence, Natural Language Processing (NLP), Information Retrieval, Security mechanisms, and Agent-based coordination** to assist maritime personnel in handling emergency and security-related situations efficiently.

---

## 📌 Project Overview

Maritime environments involve various emergency and security risks such as:

- Fire incidents
- Vessel collisions
- Medical emergencies
- Person overboard incidents
- Unauthorized access
- Suspicious activities
- Security alerts
- Vessel safety incidents

SeaGuard AI provides a centralized intelligent system that can process incident information, analyze maritime documents, retrieve relevant emergency procedures and regulations, identify potential risks, and coordinate the response between specialized AI agents.

The system follows a **multi-agent architecture**, where each agent performs a specific responsibility.

---

# 🤖 Multi-Agent Architecture

SeaGuard AI consists of four main agents.

## 1. 🔐 Security & Access Agent

**Responsible Member:** Isurini

The Security & Access Agent acts as the security checkpoint of the SeaGuard AI system.

### Main Responsibilities

- User registration and authentication
- JWT-based authentication
- Password hashing and secure credential management
- Role-Based Access Control (RBAC)
- User roles:
  - Crew
  - Officer
  - Admin
- Input validation and sanitization
- Protection against unauthorized access
- Secure handling of sensitive information
- Validation of uploaded files and requests

This agent ensures that only authenticated and authorized users can access protected system resources.

---

## 2. 📄 Document & Query Agent

**Responsible Member:** Pabodha

The Document & Query Agent processes maritime documents and natural-language queries.

### Main Responsibilities

- Maritime document processing
- PDF and text extraction
- Incident report analysis
- Safety report analysis
- Vessel document analysis
- Natural-language query processing
- Named Entity Recognition (NER)
- Text summarization
- Intent detection
- Structured information extraction

### Example Query

> What procedures should be followed after a vessel collision?

The agent analyzes the query and converts it into structured information that can be processed by the other agents.

---

## 3. 🔎 Compliance & Retrieval Agent

**Responsible Member:** Rashini

The Compliance & Retrieval Agent searches maritime emergency procedures, regulations, and knowledge-base documents.

### Main Responsibilities

- Semantic search
- Keyword-based search
- Hybrid information retrieval
- Vector-based similarity search
- Maritime procedure retrieval
- Regulation retrieval
- Compliance assessment
- Identification of missing emergency actions
- Relevant clause/procedure references
- Compliance assessment persistence

The agent compares reported actions with relevant maritime procedures and identifies whether important requirements are missing.

### Example Assessment

```json
{
  "assessment_type": "prototype_preliminary_assessment",
  "status": "PARTIALLY_ALIGNED",
  "matched_requirements": [
    "Notify the bridge and responsible officers.",
    "Assess the location and apparent extent of vessel damage."
  ],
  "missing_requirements": [
    "Raise the appropriate emergency alarm.",
    "Determine whether any person has been injured or is missing.",
    "Monitor the vessel's condition and stability."
  ]
}
```

---

## 4. 🧠 Coordinator Agent

**Responsible Member:** Pasindu

The Coordinator Agent manages communication and workflow between all SeaGuard AI agents.

Instead of allowing agents to operate independently without coordination, the Coordinator Agent determines the correct processing sequence and routes information between agents.

### Main Responsibilities

- Receive user requests
- Coordinate agent execution
- Determine required processing steps
- Route requests between agents
- Combine agent responses
- Manage workflow status
- Handle agent failures
- Support human escalation
- Generate final coordinated responses

### Example Workflow

```text
User Request
     │
     ▼
Security & Access Agent
     │
     ▼
Coordinator Agent
     │
     ├──────────────► Document & Query Agent
     │                       │
     │                       ▼
     │              Extract / Analyze Data
     │                       │
     ▼                       ▼
Compliance & Retrieval Agent
     │
     ▼
Retrieve Procedures / Regulations
     │
     ▼
Compliance / Risk Assessment
     │
     ▼
Coordinator Agent
     │
     ▼
Final Response
     │
     ▼
Human Officer (when escalation is required)
```

---

# 🚨 Main System Features

## Incident Reporting

The system supports maritime incidents including:

- Fire
- Collision
- Medical emergency
- Person overboard
- Other vessel safety incidents

## Maritime Security

The system can process security-related incidents such as:

- Unauthorized access
- Suspicious activity
- Security alerts
- Potential vessel security threats

## Incident Document Analysis

SeaGuard AI can process documents such as:

- Incident reports
- Safety reports
- Vessel documents
- Emergency procedure documents

## Information Retrieval

The system retrieves relevant information from the maritime knowledge base using:

- Keyword search
- Semantic search
- Vector similarity
- Hybrid retrieval

## Risk & Priority Identification

Incidents can be analyzed and categorized according to their severity or priority.

Example:

```text
LOW
MEDIUM
HIGH
```

## Human Escalation

Serious, uncertain, or high-risk incidents can be escalated to a responsible human officer for further decision-making.

---

# 🛠️ Technology Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic

### Database

- MongoDB
- MongoDB Atlas
- PyMongo

### Security

- JWT Authentication
- Password Hashing
- Passlib
- Bcrypt
- Role-Based Access Control

### AI / NLP / Information Retrieval

- Natural Language Processing
- Named Entity Recognition
- Text Summarization
- Intent Detection
- Semantic Search
- Vector Search
- Keyword Search
- Hybrid Retrieval

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Python Virtual Environment

---

# 📂 Project Structure

The project follows a modular backend architecture.

```text
SeaGuard-AI-Maritime-Compliance-System/
│
├── backend/
│   │
│   ├── agents/
│   │   ├── security_access_agent.py
│   │   ├── document_query_agent.py
│   │   ├── compliance_retrieval_agent.py
│   │   └── coordinator_agent.py
│   │
│   ├── models/
│   │   └── ...
│   │
│   ├── routes/
│   │   └── ...
│   │
│   ├── services/
│   │   └── ...
│   │
│   ├── utils/
│   │   └── security.py
│   │
│   ├── database/
│   │   └── ...
│   │
│   └── main.py
│
├── frontend/
│   └── ...
│
├── knowledge_base/
│   └── emergency_procedures/
│
├── tests/
│   └── ...
│
├── .gitignore
├── README.md
└── requirements.txt
```

> Note: The exact folder structure may evolve as development continues.

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/Pasindu698/SeaGuard-AI-Maritime-Compliance-System.git
```

Move into the project directory:

```bash
cd SeaGuard-AI-Maritime-Compliance-System
```

---

## 2. Create a Python Virtual Environment

### Windows

```bash
python -m venv venv
```

If `python` is unavailable:

```bash
py -m venv venv
```

---

## 3. Activate the Virtual Environment

### Windows Command Prompt

```bash
venv\Scripts\activate
```

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

---

## 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🔐 Environment Variables

Create a `.env` file in the appropriate backend/project directory.

Example:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Depending on the implementation, additional environment variables may be required.

### ⚠️ Important

Never commit the `.env` file to GitHub.

Make sure `.env` is included in `.gitignore`.

```gitignore
.env
venv/
__pycache__/
*.pyc
```

Each team member should create their own local `.env` file.

---

# 🗄️ MongoDB Setup

SeaGuard AI uses **MongoDB Atlas** as its database.

The database can store information such as:

- Users
- Authentication information
- Incident records
- Compliance assessments
- Agent processing results
- Workflow information
- Escalation records

Example database name:

```text
seaguard_ai
```

Team members must have the required MongoDB Atlas access and network permissions.

---

# ▶️ Running the Application

Make sure the virtual environment is activated.

Run the FastAPI server using:

```bash
uvicorn backend.main:app --reload
```

After starting successfully, the server should normally be available at:

```text
http://127.0.0.1:8000
```

---

# ❤️ Health Check

The backend health endpoint can be used to verify whether the API is running.

```text
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

The exact response may also include database connectivity information depending on the current implementation.

---

# 📚 API Documentation

FastAPI automatically provides interactive API documentation.

### Swagger UI

```text
http://127.0.0.1:8000/docs
```

### ReDoc

```text
http://127.0.0.1:8000/redoc
```

Swagger UI can be used to test API endpoints directly from the browser.

---

# 🔄 System Workflow

A typical SeaGuard AI request follows this process:

```text
1. User submits a request or incident report
                ↓
2. Security & Access Agent validates access
                ↓
3. Coordinator Agent receives the request
                ↓
4. Document & Query Agent analyzes the content
                ↓
5. Compliance & Retrieval Agent searches the knowledge base
                ↓
6. Relevant procedures/regulations are retrieved
                ↓
7. Compliance / risk information is generated
                ↓
8. Coordinator Agent combines the results
                ↓
9. Final response is returned
                ↓
10. High-risk or uncertain cases may be escalated
    to a human officer
```

---

# 🧪 Testing

Tests are maintained inside the:

```text
tests/
```

directory.

Tests may cover:

- Authentication
- Authorization
- Document processing
- Retrieval
- Compliance assessment
- Coordinator workflows
- Database operations

Run tests using the project's configured testing framework.

For example:

```bash
pytest
```

---

# 🌿 Git Branching Strategy

Each team member develops their component using a separate feature branch.

Example branches:

```text
main

feature/isurini/security-access-agent

feature/pabodha/document-query-agent

feature/rashini/compliance-retrieval-agent

feature/pasindu/coordinator-agent
```

Typical development workflow:

```bash
git checkout main
git pull origin main

git checkout -b feature/your-name/your-agent
```

After making changes:

```bash
git add .
git commit -m "Implement agent feature"
git push origin feature/your-name/your-agent
```

A Pull Request can then be created to merge the feature into the `main` branch.

---

# 👥 Team Members

| Member | Responsibility |
|---|---|
| **Isurini** | Security & Access Agent |
| **Pabodha** | Document & Query Agent |
| **Rashini** | Compliance & Retrieval Agent |
| **Pasindu** | Coordinator Agent |

---

# 🎯 Project Objectives

The main objectives of SeaGuard AI are to:

1. Improve maritime incident information processing.
2. Provide intelligent assistance during emergency and security situations.
3. Retrieve relevant maritime procedures efficiently.
4. Analyze incident documents using AI and NLP.
5. Identify missing or relevant procedural requirements.
6. Protect sensitive system resources through secure access control.
7. Coordinate multiple specialized agents through an intelligent workflow.
8. Support human officers instead of replacing critical human decision-making.

---

# ⚠️ Prototype Disclaimer

SeaGuard AI is currently an **academic/prototype system**.

The generated assessments and retrieved information should not be treated as a replacement for:

- Official maritime regulations
- Vessel-specific emergency procedures
- Qualified maritime officers
- Emergency authorities
- Professional safety and security decisions

Critical maritime decisions should always be verified by authorized personnel using official and current documentation.

---

# 🚀 Future Improvements

Possible future developments include:

- Advanced LLM integration
- Improved semantic retrieval
- Expanded maritime regulation knowledge base
- Real-time incident monitoring
- Automated emergency notifications
- Advanced risk scoring
- Improved human escalation workflows
- Dashboard-based incident management
- Enhanced audit logging
- Improved document OCR
- Deployment using cloud infrastructure

---

# 📄 License

This project is developed for academic and educational purposes.

---

## 🌊 SeaGuard AI

**Intelligent Multi-Agent Assistance for Maritime Emergency, Security & Incident Management**
