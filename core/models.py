from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    logo = models.ImageField(upload_to='departments/logos/', blank=True, null=True)
    banner = models.ImageField(upload_to='departments/banners/', blank=True, null=True)
    vision = models.TextField(blank=True, null=True)
    mission = models.TextField(blank=True, null=True)
    overview = models.TextField(blank=True, null=True)
    time_table_pdf = models.FileField(upload_to='departments/timetables/', blank=True, null=True)
    academic_calendar_pdf = models.FileField(upload_to='departments/calendars/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Profile(models.Model):
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('STAFF', 'Department Staff'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, blank=True, null=True, related_name='staff_profiles')

    def __str__(self):
        return f"{self.user.username} - {self.role} ({self.department.code if self.department else 'Global'})"

class Faculty(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='faculty')
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    qualification = models.CharField(max_length=100)
    experience = models.CharField(max_length=50) # e.g. "10 years"
    email = models.EmailField(blank=True, null=True)
    photo = models.ImageField(upload_to='faculty/photos/', blank=True, null=True)
    is_hod = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Faculty Members"

    def __str__(self):
        return f"{self.name} - {self.designation} ({self.department.code})"

class Laboratory(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='laboratories')
    name = models.CharField(max_length=100)
    equipment = models.TextField(blank=True, null=True, help_text="List of equipment")
    image = models.ImageField(upload_to='labs/', blank=True, null=True)

    class Meta:
        verbose_name_plural = "Laboratories"

    def __str__(self):
        return f"{self.name} ({self.department.code})"

class Newsletter(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='newsletters')
    title = models.CharField(max_length=200)
    banner_image = models.ImageField(upload_to='newsletters/banners/', blank=True, null=True)
    description = models.TextField()
    event_details = models.TextField(blank=True, null=True)
    pdf_attachment = models.FileField(upload_to='newsletters/pdfs/', blank=True, null=True)
    publish_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"{self.title} - {self.department.code} ({self.status})"

class Event(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    image = models.ImageField(upload_to='events/', blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.department.code})"

class Workshop(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='workshops')
    title = models.CharField(max_length=200)
    resource_person = models.CharField(max_length=100)
    date = models.DateField()
    image = models.ImageField(upload_to='workshops/', blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.department.code})"

class Seminar(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='seminars')
    title = models.CharField(max_length=200)
    speaker = models.CharField(max_length=100)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.department.code})"

class IndustrialVisit(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='industrial_visits')
    industry_name = models.CharField(max_length=150)
    location = models.CharField(max_length=150)
    date = models.DateField()
    image = models.ImageField(upload_to='visits/', blank=True, null=True)

    def __str__(self):
        return f"Visit to {self.industry_name} ({self.department.code})"

class Placement(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='placements')
    student_name = models.CharField(max_length=100)
    company_name = models.CharField(max_length=100)
    package = models.CharField(max_length=50) # e.g. "4.2 LPA"
    photo = models.ImageField(upload_to='placements/', blank=True, null=True)
    year = models.IntegerField(default=2026)

    def __str__(self):
        return f"{self.student_name} placed in {self.company_name} ({self.department.code})"

class StudentAchievement(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='student_achievements')
    student_name = models.CharField(max_length=100)
    achievement_details = models.TextField()
    image = models.ImageField(upload_to='achievements/students/', blank=True, null=True)

    def __str__(self):
        return f"{self.student_name} Achievement ({self.department.code})"

class FacultyAchievement(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='faculty_achievements')
    faculty_name = models.CharField(max_length=100)
    achievement_details = models.TextField()
    image = models.ImageField(upload_to='achievements/faculty/', blank=True, null=True)

    def __str__(self):
        return f"{self.faculty_name} Achievement ({self.department.code})"

class GalleryImage(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='gallery_images')
    title = models.CharField(max_length=150, blank=True, null=True)
    image = models.ImageField(upload_to='gallery/')

    def __str__(self):
        return f"Gallery image {self.id} ({self.department.code})"

class Notice(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='notices')
    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField(default=timezone.now)
    file_attachment = models.FileField(upload_to='notices/files/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.department.code})"

class Download(models.Model):
    CATEGORY_CHOICES = [
        ('NOTES', 'Notes'),
        ('SYLLABUS', 'Syllabus'),
        ('PAPERS', 'Previous Question Papers'),
    ]
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='downloads')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    file = models.FileField(upload_to='downloads/')

    def __str__(self):
        return f"{self.title} - {self.category} ({self.department.code})"

class ContactMessage(models.Model):
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, blank=True, null=True, related_name='contact_messages')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} about {self.subject}"

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.action} at {self.timestamp}"
