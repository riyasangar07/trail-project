import os
import django
import sys
from datetime import date, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dkte_ycp_portal.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Department, Profile, Faculty, Laboratory, Notice, Download, Event, Workshop, Seminar, IndustrialVisit, Placement, GalleryImage, Newsletter, StudentAchievement, FacultyAchievement, ActivityLog

def seed_database():
    print("Starting database seeding...")

    # 1. Create Super Admin
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@dkte.ac.in',
            password='admin123'
        )
        Profile.objects.create(user=admin_user, role='SUPER_ADMIN')
        print("Super admin 'admin' created (password: admin123).")
    else:
        print("Super admin 'admin' already exists.")

    # 2. Departments Data
    departments_info = [
        {
            "name": "Computer Science & Engineering",
            "code": "CSE",
            "vision": "To produce globally competent Computer Engineers with high moral values.",
            "mission": "Provide state-of-the-art infrastructure, encourage continuous learning, and foster industry collaborations.",
            "overview": "The Computer Science and Engineering department is dedicated to providing high-quality technical education and training to students to prepare them for careers in software and IT industries."
        },
        {
            "name": "Artificial Intelligence & Machine Learning",
            "code": "AIML",
            "vision": "To lead in intelligence-driven engineering education and research.",
            "mission": "Nurture student skills in modern AI algorithms, machine learning systems, and computer vision.",
            "overview": "The Artificial Intelligence and Machine Learning department prepares students for the future of automation and smart technologies, focusing on data science and deep learning."
        },
        {
            "name": "Electronics & Telecommunication Engineering",
            "code": "ENTC",
            "vision": "To impart quality education in electronics and telecommunication fields.",
            "mission": "Empower students with core electronics knowledge, telecommunication skills, and technical adaptability.",
            "overview": "The ENTC department focuses on communication technologies, embedded systems, VLSI design, and signal processing."
        },
        {
            "name": "Mechanical Engineering",
            "code": "MECH",
            "vision": "To create skilled mechanical engineers capable of solving industrial problems.",
            "mission": "Provide hands-on laboratory experience, design education, and knowledge of manufacturing standards.",
            "overview": "One of the founding departments, Mechanical Engineering teaches thermodynamics, fluid mechanics, CAD/CAM, and robotics."
        },
        {
            "name": "Civil Engineering",
            "code": "CIVIL",
            "vision": "To shape green, sustainable, and robust infrastructure developers.",
            "mission": "Integrate theoretical concepts with structural engineering lab work, surveying, and site studies.",
            "overview": "The Civil department prepares students for planning, design, and construction of buildings, roads, water supply, and transportation systems."
        },
        {
            "name": "Electrical Engineering",
            "code": "EE",
            "vision": "To light up minds with knowledge of electrical power, systems, and control.",
            "mission": "Train students in power generation, transmission, electrical machines, and energy conservation.",
            "overview": "Electrical Engineering covers power systems, grid technologies, electrical instrumentation, and electrical machine designs."
        },
        {
            "name": "Mechatronics Engineering",
            "code": "MECHATRONICS",
            "vision": "To integrate mechanical, electrical, and electronic domains into intelligent systems.",
            "mission": "Provide a multidisciplinary engineering approach, focusing on industrial automation, PLCs, and microcontrollers.",
            "overview": "Mechatronics Engineering is a synergistic fusion of mechanical engineering, electronics, and smart computer control systems."
        }
    ]

    depts = {}
    for dept_info in departments_info:
        dept, created = Department.objects.get_or_create(
            code=dept_info["code"],
            defaults={
                "name": dept_info["name"],
                "vision": dept_info["vision"],
                "mission": dept_info["mission"],
                "overview": dept_info["overview"]
            }
        )
        depts[dept.code] = dept
        if created:
            print(f"Department {dept.name} created.")
        else:
            print(f"Department {dept.name} already exists.")

    # 3. Create Department Staff
    for code, dept in depts.items():
        username = f"{code.lower()}_staff"
        if not User.objects.filter(username=username).exists():
            staff_user = User.objects.create_user(
                username=username,
                email=f"{username}@dkte.ac.in",
                password='staff123'
            )
            Profile.objects.create(user=staff_user, role='STAFF', department=dept)
            print(f"Staff user '{username}' created for department {code} (password: staff123).")
        else:
            print(f"Staff user '{username}' already exists.")

    # 4. Seed Faculty members (HOD + Faculty)
    faculty_list = [
        # CSE
        {"dept": "CSE", "name": "Dr. A. B. Patil", "desg": "Head of Department", "qual": "Ph.D. in Computer Engineering", "exp": "18 Years", "is_hod": True, "email": "abpatil@dkte.ac.in"},
        {"dept": "CSE", "name": "Prof. S. R. Mane", "desg": "Assistant Professor", "qual": "M.Tech in CSE", "exp": "8 Years", "is_hod": False, "email": "srmane@dkte.ac.in"},
        {"dept": "CSE", "name": "Prof. P. V. Kulkarni", "desg": "Assistant Professor", "qual": "M.E. in Computer Science", "exp": "6 Years", "is_hod": False, "email": "pvkulkarni@dkte.ac.in"},
        
        # AIML
        {"dept": "AIML", "name": "Dr. P. D. Kamble", "desg": "Head of Department", "qual": "Ph.D. in AI & Data Science", "exp": "15 Years", "is_hod": True, "email": "pdkamble@dkte.ac.in"},
        {"dept": "AIML", "name": "Prof. M. A. Shinde", "desg": "Assistant Professor", "qual": "M.Tech in AI", "exp": "5 Years", "is_hod": False, "email": "mashinde@dkte.ac.in"},
        
        # ENTC
        {"dept": "ENTC", "name": "Dr. V. R. Pawar", "desg": "Head of Department", "qual": "Ph.D. in Electronics", "exp": "20 Years", "is_hod": True, "email": "vrpawar@dkte.ac.in"},
        {"dept": "ENTC", "name": "Prof. D. B. Jadhav", "desg": "Assistant Professor", "qual": "M.Tech in Embedded Systems", "exp": "10 Years", "is_hod": False, "email": "dbjadhav@dkte.ac.in"},
        
        # MECH
        {"dept": "MECH", "name": "Dr. S. K. Deshmukh", "desg": "Head of Department", "qual": "Ph.D. in Design Engineering", "exp": "22 Years", "is_hod": True, "email": "skdeshmukh@dkte.ac.in"},
        {"dept": "MECH", "name": "Prof. N. P. Bhosale", "desg": "Assistant Professor", "qual": "M.E. in Heat Power", "exp": "12 Years", "is_hod": False, "email": "npbhosale@dkte.ac.in"},
        
        # CIVIL
        {"dept": "CIVIL", "name": "Dr. R. T. Naik", "desg": "Head of Department", "qual": "Ph.D. in Structural Engineering", "exp": "16 Years", "is_hod": True, "email": "rtnaik@dkte.ac.in"},
        {"dept": "CIVIL", "name": "Prof. G. C. Chavan", "desg": "Assistant Professor", "qual": "M.Tech in Construction Management", "exp": "7 Years", "is_hod": False, "email": "gcchavan@dkte.ac.in"},
        
        # EE
        {"dept": "EE", "name": "Dr. M. S. Kulkarni", "desg": "Head of Department", "qual": "Ph.D. in Power Systems", "exp": "17 Years", "is_hod": True, "email": "mskulkarni@dkte.ac.in"},
        {"dept": "EE", "name": "Prof. H. J. Joshi", "desg": "Assistant Professor", "qual": "M.E. in Control Systems", "exp": "9 Years", "is_hod": False, "email": "hjjoshi@dkte.ac.in"},
        
        # MECHATRONICS
        {"dept": "MECHATRONICS", "name": "Dr. K. A. More", "desg": "Head of Department", "qual": "Ph.D. in Mechatronics", "exp": "14 Years", "is_hod": True, "email": "kamore@dkte.ac.in"},
        {"dept": "MECHATRONICS", "name": "Prof. S. S. Salunkhe", "desg": "Assistant Professor", "qual": "M.Tech in Industrial Automation", "exp": "6 Years", "is_hod": False, "email": "sssalunkhe@dkte.ac.in"},
    ]

    for fac in faculty_list:
        dept = depts[fac["dept"]]
        if not Faculty.objects.filter(name=fac["name"], department=dept).exists():
            Faculty.objects.create(
                department=dept,
                name=fac["name"],
                designation=fac["desg"],
                qualification=fac["qual"],
                experience=fac["exp"],
                email=fac["email"],
                is_hod=fac["is_hod"]
            )
    print("Faculty members seeded.")

    # 5. Seed Laboratories
    labs_list = [
        {"dept": "CSE", "name": "Software Engineering Lab", "equip": "Intel Core i5 PCs, Rational Rose, VS Code, Git, Python IDEs"},
        {"dept": "CSE", "name": "Database Management Systems Lab", "equip": "MySQL Server, PostgreSQL client, Oracle Database setups, Ubuntu OS"},
        {"dept": "AIML", "name": "Deep Learning Lab", "equip": "High-end GPU Workstations, NVIDIA Cuda Toolkit, PyTorch, TensorFlow"},
        {"dept": "ENTC", "name": "Microprocessor & VLSI Lab", "equip": "8086 kits, FPGA boards, Xilinx Vivado software, CROs, Function Generators"},
        {"dept": "MECH", "name": "CAD/CAM Simulation Lab", "equip": "AutoCAD, SolidWorks, ANSYS Simulation software, CNC Trainer Lathe"},
        {"dept": "CIVIL", "name": "Geotechnical Lab", "equip": "Direct shear test apparatus, Triaxial setup, Liquid limit device"},
        {"dept": "EE", "name": "Electrical Machines Lab", "equip": "AC/DC Motors, Alternators, Transformers, Synchronization panel"},
        {"dept": "MECHATRONICS", "name": "Robotics & Automation Lab", "equip": "ABB Industrial Robotic Arm, PLC Training benches, Pneumatic cylinders"}
    ]

    for lab in labs_list:
        dept = depts[lab["dept"]]
        if not Laboratory.objects.filter(name=lab["name"], department=dept).exists():
            Laboratory.objects.create(
                department=dept,
                name=lab["name"],
                equipment=lab["equip"]
            )
    print("Laboratories seeded.")

    # 6. Seed Placements
    placements_list = [
        {"dept": "CSE", "student": "Ajit R. Patil", "company": "Tata Consultancy Services (TCS)", "package": "4.5 LPA", "year": 2025},
        {"dept": "CSE", "student": "Sneha V. Kadam", "company": "Cognizant", "package": "4.2 LPA", "year": 2025},
        {"dept": "AIML", "student": "Rohan S. Mane", "company": "Infosys AI Practice", "package": "5.0 LPA", "year": 2025},
        {"dept": "ENTC", "student": "Pooja D. Jadhav", "company": "KPIT Technologies", "package": "4.0 LPA", "year": 2025},
        {"dept": "MECH", "student": "Vikram S. Thorat", "company": "Tata Motors", "package": "3.8 LPA", "year": 2025},
        {"dept": "CIVIL", "student": "Aniket A. Ghorpade", "company": "L&T Construction", "package": "3.6 LPA", "year": 2025},
        {"dept": "EE", "student": "Manish S. Patil", "company": "Schneider Electric", "package": "4.2 LPA", "year": 2025},
        {"dept": "MECHATRONICS", "student": "Mayur B. Shinde", "company": "Siemens India", "package": "4.8 LPA", "year": 2025}
    ]

    for plc in placements_list:
        dept = depts[plc["dept"]]
        if not Placement.objects.filter(student_name=plc["student"], department=dept).exists():
            Placement.objects.create(
                department=dept,
                student_name=plc["student"],
                company_name=plc["company"],
                package=plc["package"],
                year=plc["year"]
            )
    print("Placement records seeded.")

    # 7. Seed Notices
    notices_list = [
        {"dept": "CSE", "title": "Submitting Capstone Project Synopsis", "content": "All final year diploma students must submit their project synopsis to their respective guides by Friday, 10th August. Ensure templates are followed.", "date": date.today() - timedelta(days=2)},
        {"dept": "AIML", "title": "Guest Lecture on Generative AI Trends", "content": "A guest lecture by industry lead engineer Mr. Ramesh Shinde from Google on GenAI and LLMs is scheduled for Monday at 10:00 AM in Seminar Hall 1.", "date": date.today() - timedelta(days=1)},
        {"dept": "MECH", "title": "Workshop on CNC Machining and Tooling", "content": "Mechatronics and Mechanical students are invited to a workshop on CNC Programming on 15th August. Registration link open.", "date": date.today()},
        {"dept": "CIVIL", "title": "Site Visit to Highway Flyover Construction", "content": "Civil third-year students will undergo a mandatory site visit for Surveying/Transportation Engineering subject on Wednesday. Carry safety shoes.", "date": date.today() - timedelta(days=5)}
    ]

    for notc in notices_list:
        dept = depts[notc["dept"]]
        if not Notice.objects.filter(title=notc["title"], department=dept).exists():
            Notice.objects.create(
                department=dept,
                title=notc["title"],
                content=notc["content"],
                date=notc["date"]
            )
    print("Notices seeded.")

    # 8. Seed Newsletters (Both Approved and Pending Approval)
    newsletters_list = [
        {
            "dept": "CSE",
            "title": "ByteQuest - Volume 12, Issue 1",
            "description": "ByteQuest is the biannual CSE Department newsletter covering major highlights of the semester, student contributions, research publications by faculty, and latest software labs additions.",
            "event_details": "Includes reports from Hackathon 2025, Cloud Computing workshops, and Web Development bootcamps conducted during July.",
            "status": "APPROVED",
            "date": date.today() - timedelta(days=20)
        },
        {
            "dept": "AIML",
            "title": "AI Horizon - Inaugural Issue",
            "description": "The Artificial Intelligence and Machine Learning department is proud to publish its first newsletter, AI Horizon. Read about the new Nvidia Jetson AI lab setup.",
            "event_details": "Features student achievements in AI coding contests, and details of faculty certification in DeepLearning.AI courses.",
            "status": "APPROVED",
            "date": date.today() - timedelta(days=15)
        },
        {
            "dept": "ENTC",
            "title": "Telecom Buzz - June 2025 Edition",
            "description": "Telecom Buzz highlights modern advances in wireless network setups, internet of things projects by ENTC students, and basic electronics lab expansions.",
            "event_details": "Reports on the Industrial visit to BSNL Exchange Kolhapur and embedded systems project competition.",
            "status": "APPROVED",
            "date": date.today() - timedelta(days=12)
        },
        {
            "dept": "MECH",
            "title": "GearShift - Spring Newsletter",
            "description": "GearShift covers mechanical engineering accomplishments, including our Go-Kart racing team's participation in national championship.",
            "event_details": "Includes details on SolidWorks training modules and CAD modeling event reports.",
            "status": "APPROVED",
            "date": date.today() - timedelta(days=8)
        },
        {
            "dept": "CSE",
            "title": "ByteQuest - Volume 12, Issue 2 (Pending Review)",
            "description": "Draft newsletter summarizing recent placement drives where 15+ students got selected in global technology firms.",
            "event_details": "Features interviews of placed students, feedback from HOD, and guidelines for mock interviews.",
            "status": "PENDING",
            "date": date.today()
        },
        {
            "dept": "MECHATRONICS",
            "title": "MechaNews - Special Automation Issue",
            "description": "Comprehensive guide to industrial automation projects. Highlight of Arduino/Raspberry Pi integrated projects.",
            "event_details": "Includes details of the seminar conducted by Siemens Engineers on PLC operations.",
            "status": "PENDING",
            "date": date.today() - timedelta(days=1)
        }
    ]

    for nl in newsletters_list:
        dept = depts[nl["dept"]]
        if not Newsletter.objects.filter(title=nl["title"], department=dept).exists():
            Newsletter.objects.create(
                department=dept,
                title=nl["title"],
                description=nl["description"],
                event_details=nl["event_details"],
                status=nl["status"],
                publish_date=nl["date"]
            )
    print("Newsletters seeded.")

    # 9. Seed Activities and Events
    events_list = [
        {"dept": "CSE", "title": "National Level Tech-Fest CodeStorm", "desc": "A coding competition testing algorithmic knowledge and problem-solving speed.", "date": date.today() + timedelta(days=10)},
        {"dept": "MECH", "title": "Automotive CAD Design Challenge", "desc": "Design competition on designing automotive engines utilizing CAD software.", "date": date.today() + timedelta(days=15)},
        {"dept": "EE", "title": "Seminar on Electrical Safety and Auditing", "desc": "Guest lecture highlighting energy auditing standards and safety protocols.", "date": date.today() + timedelta(days=5)}
    ]

    for ev in events_list:
        dept = depts[ev["dept"]]
        if not Event.objects.filter(title=ev["title"], department=dept).exists():
            Event.objects.create(
                department=dept,
                title=ev["title"],
                description=ev["desc"],
                date=ev["date"]
            )
    print("Events seeded.")

    # 10. Seed Downloads
    # We will just write references.
    downloads_list = [
        {"dept": "CSE", "title": "CSE Third Year Syllabus (MSBTE I-Scheme)", "cat": "SYLLABUS"},
        {"dept": "CSE", "title": "Software Engineering Notes - All Units", "cat": "NOTES"},
        {"dept": "CSE", "title": "DBMS Solved Question Paper Summer 2024", "cat": "PAPERS"},
        {"dept": "AIML", "title": "AIML Curriculum & Lab Guidelines", "cat": "SYLLABUS"},
        {"dept": "ENTC", "title": "Embedded Systems Course Notes", "cat": "NOTES"},
        {"dept": "MECH", "title": "Fluid Mechanics Core Formula Sheet", "cat": "NOTES"}
    ]

    # Create dummy files for Downloads in Django's Media directory so download actions work
    media_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'downloads')
    os.makedirs(media_dir, exist_ok=True)
    
    # Create simple dummy text files representing PDFs
    for dn in downloads_list:
        dept = depts[dn["dept"]]
        file_name = f"{dn['title'].replace(' ', '_').lower()}.txt"
        file_path = os.path.join(media_dir, file_name)
        if not os.path.exists(file_path):
            with open(file_path, 'w') as f:
                f.write(f"DKTE YCP Diploma Newsletter Portal Mock Download File\nCategory: {dn['cat']}\nDepartment: {dept.name}\nDocument Title: {dn['title']}")
        
        # Save model reference
        rel_path = f"downloads/{file_name}"
        if not Download.objects.filter(title=dn["title"], department=dept).exists():
            Download.objects.create(
                department=dept,
                title=dn["title"],
                category=dn["cat"],
                file=rel_path
            )
    print("Downloads seeded.")

    # Create dummy file links for notices and timetables as well
    timetables_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'departments', 'timetables')
    calendars_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'departments', 'calendars')
    os.makedirs(timetables_dir, exist_ok=True)
    os.makedirs(calendars_dir, exist_ok=True)

    for code, dept in depts.items():
        tt_name = f"timetable_{code.lower()}.txt"
        tt_path = os.path.join(timetables_dir, tt_name)
        if not os.path.exists(tt_path):
            with open(tt_path, 'w') as f:
                f.write(f"DKTE YCP Diploma {code} Academic Time Table")
        dept.time_table_pdf = f"departments/timetables/{tt_name}"

        cal_name = f"calendar_{code.lower()}.txt"
        cal_path = os.path.join(calendars_dir, cal_name)
        if not os.path.exists(cal_path):
            with open(cal_path, 'w') as f:
                f.write(f"DKTE YCP Diploma {code} Academic Calendar")
        dept.academic_calendar_pdf = f"departments/calendars/{cal_name}"
        
        dept.save()

    print("Timetable and Calendar files seeded.")
    print("All seeding activities completed successfully!")

if __name__ == "__main__":
    seed_database()
