"""
seed_data.py — Populate database with realistic test data.

Creates:
  - 1 admin user
  - 5 recruiters (Google, Microsoft, Infosys, Wipro, Flipkart)
  - 15 jobs (3 per recruiter)
  - 20 students with profiles
  - 10 applications in various states
  - Matches (via matching engine)
  - Sample notifications
"""

import os
import sys

# Add parent to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta

from passlib.context import CryptContext

from database.connection import SessionLocal, create_tables
from database.models import (
    Application, ApplicationEvent, Match, Notification,
    Recruiter, Student, StudentProfile, User, Job,
)

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    create_tables()
    db = SessionLocal()

    # Clear existing data
    db.query(Notification).delete()
    db.query(ApplicationEvent).delete()
    db.query(Application).delete()
    db.query(Match).delete()
    db.query(StudentProfile).delete()
    db.query(Student).delete()
    db.query(Job).delete()
    db.query(Recruiter).delete()
    db.query(User).delete()
    db.commit()

    # ── Admin ──────────────────────────────────────────────────────────────────
    admin_user = User(
        email="admin@college.edu",
        password_hash=pwd_ctx.hash("admin123"),
        role="admin",
    )
    db.add(admin_user)
    db.flush()

    # ── Recruiters ─────────────────────────────────────────────────────────────
    recruiter_data = [
        ("Google", "Technology", "Sarah Chen", "sarah@google.com", "google.com",
         {"min_cgpa": 7.5, "preferred_branches": ["CSE", "IT", "ECE"], "role_types": ["Software Engineering", "Data Science"]}),
        ("Microsoft", "Technology", "John Smith", "john@microsoft.com", "microsoft.com",
         {"min_cgpa": 7.0, "preferred_branches": ["CSE", "IT"], "role_types": ["Software Engineering", "Cloud"]}),
        ("Infosys", "IT Services", "Priya Sharma", "priya@infosys.com", "infosys.com",
         {"min_cgpa": 6.5, "preferred_branches": ["CSE", "IT", "ECE", "ME"], "role_types": ["Systems Engineer", "Analyst"]}),
        ("Wipro", "IT Services", "Raj Kumar", "raj@wipro.com", "wipro.com",
         {"min_cgpa": 6.0, "preferred_branches": ["CSE", "IT", "ECE", "ME", "EE"], "role_types": ["Software Developer", "QA"]}),
        ("Flipkart", "E-Commerce", "Neha Gupta", "neha@flipkart.com", "flipkart.com",
         {"min_cgpa": 7.0, "preferred_branches": ["CSE", "IT"], "role_types": ["Software Engineer", "Product"]}),
    ]

    recruiters = []
    for company, sector, contact, email, website, prefs in recruiter_data:
        r_user = User(email=email, password_hash=pwd_ctx.hash("recruiter123"), role="recruiter")
        db.add(r_user)
        db.flush()
        rec = Recruiter(
            user_id=r_user.id,
            company_name=company,
            sector=sector,
            contact_name=contact,
            website=website,
            engagement_score=70 + len(recruiters) * 5,
            last_active=datetime.utcnow() - timedelta(days=len(recruiters)),
        )
        rec.preferences = prefs
        db.add(rec)
        db.flush()
        recruiters.append(rec)

    # ── Jobs ───────────────────────────────────────────────────────────────────
    jobs_data = [
        # Google jobs
        {
            "recruiter": recruiters[0], "title": "Software Engineer — Backend",
            "description": "Build scalable distributed systems using Python, Go, and Kubernetes. Strong understanding of system design, REST APIs, and cloud infrastructure required.",
            "location": "Bangalore", "ctc_min": 2000000, "ctc_max": 3500000,
            "required_skills": ["Python", "Go", "Kubernetes", "Docker", "System Design"],
            "preferred_skills": ["gRPC", "Terraform", "GCP"],
            "min_cgpa": 7.5, "eligible_branches": ["CSE", "IT", "ECE"],
        },
        {
            "recruiter": recruiters[0], "title": "Machine Learning Engineer",
            "description": "Develop ML models for search ranking and recommendations. Experience with TensorFlow, PyTorch, and large-scale data pipelines required.",
            "location": "Hyderabad", "ctc_min": 2500000, "ctc_max": 4500000,
            "required_skills": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "SQL"],
            "preferred_skills": ["Kubernetes", "Spark", "BigQuery"],
            "min_cgpa": 8.0, "eligible_branches": ["CSE", "IT"],
        },
        {
            "recruiter": recruiters[0], "title": "Frontend Engineer — React",
            "description": "Build beautiful, performant user interfaces with React and TypeScript. Passion for UI/UX and attention to detail required.",
            "location": "Bangalore", "ctc_min": 1800000, "ctc_max": 3000000,
            "required_skills": ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
            "preferred_skills": ["Node.js", "GraphQL", "Tailwind"],
            "min_cgpa": 7.0, "eligible_branches": ["CSE", "IT"],
        },
        # Microsoft jobs
        {
            "recruiter": recruiters[1], "title": "Software Development Engineer",
            "description": "Design and implement cloud-native services for Azure platform. Strong coding skills in C# or Java.",
            "location": "Hyderabad", "ctc_min": 1800000, "ctc_max": 3200000,
            "required_skills": ["Java", "C++", "Data Structures", "Algorithms", "Azure"],
            "preferred_skills": ["Kubernetes", "Docker", "Microservices"],
            "min_cgpa": 7.0, "eligible_branches": ["CSE", "IT"],
        },
        {
            "recruiter": recruiters[1], "title": "Data Engineer",
            "description": "Build and maintain data pipelines for business intelligence. Experience with SQL, Python, and cloud data warehouses.",
            "location": "Bangalore", "ctc_min": 1600000, "ctc_max": 2800000,
            "required_skills": ["Python", "SQL", "Azure", "Spark", "ETL"],
            "preferred_skills": ["Databricks", "Airflow", "Power BI"],
            "min_cgpa": 7.0, "eligible_branches": ["CSE", "IT", "ECE"],
        },
        {
            "recruiter": recruiters[1], "title": "Cloud Solutions Architect",
            "description": "Design enterprise cloud solutions and help customers migrate to Azure.",
            "location": "Mumbai", "ctc_min": 2200000, "ctc_max": 3800000,
            "required_skills": ["Azure", "AWS", "Docker", "Kubernetes", "Networking"],
            "preferred_skills": ["Terraform", "Python", "Security"],
            "min_cgpa": 7.5, "eligible_branches": ["CSE", "IT", "ECE"],
        },
        # Infosys jobs
        {
            "recruiter": recruiters[2], "title": "Systems Engineer",
            "description": "Entry-level software engineering role. Learn and contribute to enterprise projects across Java, Python, and database technologies.",
            "location": "Pune", "ctc_min": 600000, "ctc_max": 900000,
            "required_skills": ["Java", "Python", "SQL", "Problem Solving"],
            "preferred_skills": ["Spring Boot", "MySQL", "Linux"],
            "min_cgpa": 6.5, "eligible_branches": ["CSE", "IT", "ECE", "ME"],
        },
        {
            "recruiter": recruiters[2], "title": "Business Analyst",
            "description": "Bridge the gap between business requirements and technical implementation.",
            "location": "Chennai", "ctc_min": 700000, "ctc_max": 1100000,
            "required_skills": ["Communication", "SQL", "Problem Solving", "Excel"],
            "preferred_skills": ["Tableau", "Python", "Jira"],
            "min_cgpa": 6.5, "eligible_branches": ["CSE", "IT", "ECE", "ME", "EE"],
        },
        {
            "recruiter": recruiters[2], "title": "Full Stack Developer",
            "description": "Develop web applications using React and Spring Boot for enterprise clients.",
            "location": "Bangalore", "ctc_min": 800000, "ctc_max": 1400000,
            "required_skills": ["React", "Java", "SQL", "JavaScript", "HTML"],
            "preferred_skills": ["Spring Boot", "MySQL", "Docker"],
            "min_cgpa": 6.5, "eligible_branches": ["CSE", "IT"],
        },
        # Wipro jobs
        {
            "recruiter": recruiters[3], "title": "Software Developer",
            "description": "Develop and maintain software solutions for global clients.",
            "location": "Bangalore", "ctc_min": 550000, "ctc_max": 850000,
            "required_skills": ["Python", "Java", "SQL", "Teamwork"],
            "preferred_skills": ["Django", "Spring", "MySQL"],
            "min_cgpa": 6.0, "eligible_branches": ["CSE", "IT", "ECE", "ME"],
        },
        {
            "recruiter": recruiters[3], "title": "QA Automation Engineer",
            "description": "Build automated test frameworks using Selenium and Python.",
            "location": "Hyderabad", "ctc_min": 600000, "ctc_max": 1000000,
            "required_skills": ["Python", "Selenium", "Testing", "SQL"],
            "preferred_skills": ["Pytest", "Jenkins", "Docker"],
            "min_cgpa": 6.0, "eligible_branches": ["CSE", "IT", "ECE"],
        },
        {
            "recruiter": recruiters[3], "title": "DevOps Engineer",
            "description": "Manage CI/CD pipelines and cloud infrastructure.",
            "location": "Pune", "ctc_min": 900000, "ctc_max": 1600000,
            "required_skills": ["Docker", "Kubernetes", "Linux", "Python", "AWS"],
            "preferred_skills": ["Terraform", "Jenkins", "Ansible"],
            "min_cgpa": 6.5, "eligible_branches": ["CSE", "IT", "ECE"],
        },
        # Flipkart jobs
        {
            "recruiter": recruiters[4], "title": "Software Development Engineer — I",
            "description": "Build high-performance services for India's largest e-commerce platform.",
            "location": "Bangalore", "ctc_min": 1600000, "ctc_max": 2800000,
            "required_skills": ["Python", "Java", "Data Structures", "Algorithms", "SQL"],
            "preferred_skills": ["Kafka", "Redis", "Microservices"],
            "min_cgpa": 7.0, "eligible_branches": ["CSE", "IT"],
        },
        {
            "recruiter": recruiters[4], "title": "Data Scientist",
            "description": "Apply ML/AI to solve supply chain, pricing, and personalization problems at scale.",
            "location": "Bangalore", "ctc_min": 1800000, "ctc_max": 3200000,
            "required_skills": ["Python", "Machine Learning", "scikit-learn", "SQL", "Statistics"],
            "preferred_skills": ["Spark", "Deep Learning", "A/B Testing"],
            "min_cgpa": 7.5, "eligible_branches": ["CSE", "IT", "ECE"],
        },
        {
            "recruiter": recruiters[4], "title": "Product Manager (Tech)",
            "description": "Drive product strategy and execution for checkout and payments platform.",
            "location": "Bangalore", "ctc_min": 2000000, "ctc_max": 3500000,
            "required_skills": ["Communication", "Problem Solving", "SQL", "Leadership"],
            "preferred_skills": ["Python", "Analytics", "Agile"],
            "min_cgpa": 7.0, "eligible_branches": ["CSE", "IT"],
        },
    ]

    jobs = []
    for jd in jobs_data:
        job = Job(
            recruiter_id=jd["recruiter"].id,
            title=jd["title"],
            description=jd["description"],
            location=jd["location"],
            ctc_min=jd["ctc_min"],
            ctc_max=jd["ctc_max"],
            min_cgpa=jd["min_cgpa"],
            graduation_year=2024,
            status="active",
            application_deadline=datetime.utcnow() + timedelta(days=30),
        )
        job.required_skills = jd["required_skills"]
        job.preferred_skills = jd["preferred_skills"]
        job.eligible_branches = jd["eligible_branches"]
        job.skill_string = " ".join(jd["required_skills"] + jd["preferred_skills"])
        db.add(job)
        db.flush()
        jobs.append(job)

    # ── Students ───────────────────────────────────────────────────────────────
    students_data = [
        ("arjun@college.edu", "Arjun Sharma", "CS001", "CSE", 2024, 8.7,
         ["Python", "Machine Learning", "React", "SQL", "TensorFlow", "Docker"],
         {"Programming": 90, "Data Science": 85, "Web Dev": 70, "Cloud": 40, "Soft Skills": 65}),
        ("priya@college.edu", "Priya Patel", "CS002", "CSE", 2024, 9.1,
         ["Java", "Spring Boot", "Microservices", "AWS", "Docker", "Kubernetes"],
         {"Programming": 92, "Data Science": 50, "Web Dev": 65, "Cloud": 85, "Soft Skills": 70}),
        ("rahul@college.edu", "Rahul Verma", "IT001", "IT", 2024, 7.8,
         ["Python", "Django", "React", "MySQL", "JavaScript"],
         {"Programming": 75, "Data Science": 55, "Web Dev": 85, "Cloud": 30, "Soft Skills": 60}),
        ("sneha@college.edu", "Sneha Reddy", "CS003", "CSE", 2024, 8.2,
         ["Machine Learning", "Python", "scikit-learn", "Statistics", "R", "Tableau"],
         {"Programming": 72, "Data Science": 92, "Web Dev": 35, "Cloud": 45, "Soft Skills": 68}),
        ("amit@college.edu", "Amit Kumar", "ECE001", "ECE", 2024, 7.5,
         ["Embedded Systems", "C++", "Python", "MATLAB", "IoT"],
         {"Programming": 70, "Data Science": 45, "Web Dev": 25, "Cloud": 35, "Soft Skills": 65}),
        ("divya@college.edu", "Divya Menon", "CSE004", "CSE", 2024, 8.9,
         ["React", "Node.js", "TypeScript", "GraphQL", "MongoDB", "CSS"],
         {"Programming": 80, "Data Science": 40, "Web Dev": 95, "Cloud": 50, "Soft Skills": 75}),
        ("vikram@college.edu", "Vikram Singh", "IT002", "IT", 2024, 7.2,
         ["Java", "SQL", "Linux", "Shell Scripting", "Testing"],
         {"Programming": 68, "Data Science": 35, "Web Dev": 45, "Cloud": 40, "Soft Skills": 72}),
        ("ananya@college.edu", "Ananya Das", "CS005", "CSE", 2024, 8.5,
         ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis"],
         {"Programming": 85, "Data Science": 65, "Web Dev": 78, "Cloud": 72, "Soft Skills": 68}),
        ("karan@college.edu", "Karan Mehta", "ME001", "ME", 2024, 7.0,
         ["Python", "MATLAB", "AutoCAD", "Simulation", "C++"],
         {"Programming": 55, "Data Science": 48, "Web Dev": 20, "Cloud": 25, "Soft Skills": 70}),
        ("isha@college.edu", "Isha Joshi", "CSE006", "CSE", 2024, 9.3,
         ["Machine Learning", "Deep Learning", "PyTorch", "Python", "Research", "NLP"],
         {"Programming": 88, "Data Science": 97, "Web Dev": 40, "Cloud": 55, "Soft Skills": 62}),
        ("rohan@college.edu", "Rohan Gupta", "IT003", "IT", 2024, 7.6,
         ["AWS", "Terraform", "Docker", "Kubernetes", "Python", "Linux"],
         {"Programming": 72, "Data Science": 42, "Web Dev": 45, "Cloud": 90, "Soft Skills": 65}),
        ("meera@college.edu", "Meera Nair", "CSE007", "CSE", 2024, 8.0,
         ["JavaScript", "React", "Vue.js", "Node.js", "SQL", "HTML", "CSS"],
         {"Programming": 78, "Data Science": 38, "Web Dev": 93, "Cloud": 35, "Soft Skills": 78}),
        ("suresh@college.edu", "Suresh Iyer", "ECE002", "ECE", 2024, 6.8,
         ["Python", "SQL", "Java", "Communication"],
         {"Programming": 60, "Data Science": 40, "Web Dev": 35, "Cloud": 25, "Soft Skills": 80}),
        ("pooja@college.edu", "Pooja Sharma", "CSE008", "CSE", 2024, 8.4,
         ["Python", "SQL", "Spark", "Hadoop", "Hive", "Data Engineering"],
         {"Programming": 78, "Data Science": 88, "Web Dev": 30, "Cloud": 65, "Soft Skills": 60}),
        ("nikhil@college.edu", "Nikhil Agarwal", "IT004", "IT", 2024, 7.9,
         ["Java", "Spring Boot", "MySQL", "REST API", "Microservices"],
         {"Programming": 82, "Data Science": 42, "Web Dev": 75, "Cloud": 48, "Soft Skills": 68}),
        ("shreya@college.edu", "Shreya Kulkarni", "CSE009", "CSE", 2024, 8.6,
         ["Python", "Machine Learning", "Flask", "SQL", "Statistics"],
         {"Programming": 82, "Data Science": 85, "Web Dev": 60, "Cloud": 38, "Soft Skills": 72}),
        ("arun@college.edu", "Arun Krishnan", "ECE003", "ECE", 2024, 7.3,
         ["C++", "Python", "Signal Processing", "VLSI", "MATLAB"],
         {"Programming": 65, "Data Science": 52, "Web Dev": 20, "Cloud": 30, "Soft Skills": 62}),
        ("tanvi@college.edu", "Tanvi Bhat", "CSE010", "CSE", 2024, 9.0,
         ["Python", "Go", "Kubernetes", "AWS", "System Design", "Distributed Systems"],
         {"Programming": 92, "Data Science": 62, "Web Dev": 55, "Cloud": 88, "Soft Skills": 70}),
        ("deepak@college.edu", "Deepak Mishra", "IT005", "IT", 2024, 7.4,
         ["React", "JavaScript", "HTML", "CSS", "Node.js", "MongoDB"],
         {"Programming": 72, "Data Science": 30, "Web Dev": 88, "Cloud": 32, "Soft Skills": 75}),
        ("ayesha@college.edu", "Ayesha Khan", "CSE011", "CSE", 2024, 8.1,
         ["Python", "Data Science", "Pandas", "NumPy", "Visualization", "SQL"],
         {"Programming": 75, "Data Science": 90, "Web Dev": 40, "Cloud": 42, "Soft Skills": 70}),
    ]

    students = []
    for email, name, roll, branch, grad_year, cgpa, skills, radar in students_data:
        s_user = User(email=email, password_hash=pwd_ctx.hash("student123"), role="student")
        db.add(s_user)
        db.flush()
        student = Student(
            user_id=s_user.id,
            full_name=name,
            roll_number=roll,
            branch=branch,
            graduation_year=grad_year,
            cgpa=cgpa,
            phone=f"+91-98765{len(students):05d}",
            linkedin_url=f"linkedin.com/in/{name.lower().replace(' ', '-')}",
            status="active",
        )
        db.add(student)
        db.flush()

        # Compute profile score
        score = min(100, 40 + len(skills) * 5 + int(cgpa * 5))

        profile = StudentProfile(
            student_id=student.id,
            profile_score=score,
            last_parsed_at=datetime.utcnow(),
        )
        profile.canonical_skills = skills
        profile.skill_radar = radar
        profile.skill_gaps = _compute_gaps(skills)
        profile.raw_parsed_data = {
            "name": name, "email": email,
            "education": [{"institution": "Example College", "degree": "B.Tech", "cgpa": cgpa}],
            "skills": skills,
        }
        db.add(profile)
        db.flush()
        student.profile_score = score
        students.append((student, skills))

    db.flush()

    # ── Matches via TF-IDF ─────────────────────────────────────────────────────
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        student_strings = [" ".join(s[1]) for s in students]
        job_strings = [j.skill_string or " ".join(j.required_skills) for j in jobs]

        corpus = student_strings + job_strings
        vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        tfidf = vec.fit_transform(corpus)
        sim = cosine_similarity(tfidf[:len(students)], tfidf[len(students):])

        for si, (student, s_skills) in enumerate(students):
            for ji, job in enumerate(jobs):
                score_val = float(sim[si][ji]) * 100
                eligible = (
                    (student.cgpa or 0) >= (job.min_cgpa or 0) and
                    (not job.eligible_branches or student.branch in job.eligible_branches)
                )
                overlap = list(set(s_skills) & set(job.required_skills + job.preferred_skills))
                missing = [s for s in job.required_skills if s not in s_skills]

                m = Match(
                    student_id=student.id,
                    job_id=job.id,
                    score=round(score_val, 2),
                    eligible=eligible,
                )
                m.skill_overlap = overlap
                m.missing_skills = missing[:5]
                db.add(m)

        db.flush()
        print("[OK] Matches computed via TF-IDF")
    except Exception as e:
        print(f"  Match computation skipped: {e}")

    # ── Applications ───────────────────────────────────────────────────────────
    app_configs = [
        (students[0][0], jobs[0], "interview_scheduled", {"interview_date": "2024-06-20T10:00:00"}),
        (students[0][0], jobs[1], "screening", {}),
        (students[1][0], jobs[3], "offer_received", {"ctc_offered": 2800000}),
        (students[1][0], jobs[5], "accepted", {"ctc_offered": 3200000}),
        (students[2][0], jobs[8], "applied", {}),
        (students[3][0], jobs[1], "interview_done", {}),
        (students[4][0], jobs[6], "applied", {}),
        (students[5][0], jobs[2], "interview_scheduled", {"interview_date": "2024-06-25T14:00:00"}),
        (students[7][0], jobs[0], "screening", {}),
        (students[9][0], jobs[1], "applied", {}),
    ]

    for student, job, status, meta in app_configs:
        app = Application(
            student_id=student.id,
            job_id=job.id,
            status=status,
            applied_at=datetime.utcnow() - timedelta(days=10),
        )
        if status == "offer_received" and "ctc_offered" in meta:
            app.ctc_offered = meta["ctc_offered"]
        if status == "accepted" and "ctc_offered" in meta:
            app.ctc_offered = meta["ctc_offered"]
            student.status = "placed"
        db.add(app)
        db.flush()

        event = ApplicationEvent(application_id=app.id, from_status=None, to_status="applied")
        event.event_metadata = {}
        db.add(event)

        if status not in ("applied",):
            event2 = ApplicationEvent(application_id=app.id, from_status="applied", to_status=status)
            event2.event_metadata = meta
            db.add(event2)

    # ── Notifications ──────────────────────────────────────────────────────────
    notif_data = [
        (students[0][0].user_id, "match_alert", "New Job Match: Google SWE",
         "You have a 87% match with Software Engineer at Google! Apply now."),
        (students[1][0].user_id, "shortlist", "You've been shortlisted at Microsoft!",
         "Congratulations! Microsoft has shortlisted you for the SDE position."),
        (students[0][0].user_id, "reminder", "Interview Tomorrow — Google",
         "Your interview at Google is scheduled for tomorrow at 10:00 AM."),
        (students[3][0].user_id, "match_alert", "New Job Match: Flipkart Data Scientist",
         "You have a 92% match with Data Scientist at Flipkart!"),
        (students[5][0].user_id, "digest", "Top 3 Job Matches Today",
         "Check out your top matches: Google Frontend, Infosys Full Stack, Wipro DevOps."),
    ]

    for user_id, ntype, title, body in notif_data:
        n = Notification(
            user_id=user_id,
            type=ntype,
            title=title,
            body=body,
            sent_via="in_app",
            delivery_status="sent",
        )
        db.add(n)

    db.commit()
    print("[OK] Seed data inserted successfully!")
    print("  Admin: admin@college.edu / admin123")
    print("  Student: arjun@college.edu / student123")
    print("  Recruiter: sarah@google.com / recruiter123")
    db.close()


def _compute_gaps(skills: list) -> list:
    in_demand = [
        "Docker", "Kubernetes", "System Design", "AWS", "Go",
        "TypeScript", "GraphQL", "Redis", "Kafka", "Terraform"
    ]
    return [s for s in in_demand if s not in skills][:5]


if __name__ == "__main__":
    seed()
