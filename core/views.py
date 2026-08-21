from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Disable CSRF verification for API sessions

from core.models import (
    Department, Profile, Faculty, Laboratory, Notice, Download, Event, 
    Workshop, Seminar, IndustrialVisit, Placement, GalleryImage, Newsletter, 
    StudentAchievement, FacultyAchievement, ActivityLog, ContactMessage
)
from core.serializers import (
    UserSerializer, DepartmentSerializer, FacultySerializer, LaboratorySerializer, 
    NoticeSerializer, DownloadSerializer, EventSerializer, WorkshopSerializer, 
    SeminarSerializer, IndustrialVisitSerializer, PlacementSerializer, 
    GalleryImageSerializer, NewsletterSerializer, StudentAchievementSerializer, 
    FacultyAchievementSerializer, ActivityLogSerializer, ContactMessageSerializer
)

# Helper function to log activities
def log_user_action(user, action):
    if user.is_authenticated:
        ActivityLog.objects.create(user=user, action=action)

# Helper function to check role permissions
def is_super_admin(user):
    return user.is_authenticated and (user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'SUPER_ADMIN'))

def is_staff_for_dept(user, dept_id):
    if not user.is_authenticated:
        return False
    if is_super_admin(user):
        return True
    try:
        profile = user.profile
        return profile.role == 'STAFF' and profile.department_id == int(dept_id)
    except (Profile.DoesNotExist, TypeError, ValueError):
        return False

# ==========================================
# AUTHENTICATION APIS
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        # Ensure profile exists
        profile, created = Profile.objects.get_or_create(user=user, defaults={'role': 'STAFF'})
        log_user_action(user, f"Logged in successfully.")
        serializer = UserSerializer(user)
        return Response({
            "message": "Login successful",
            "user": serializer.data
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid username or password"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def api_logout(request):
    log_user_action(request.user, "Logged out.")
    logout(request)
    return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

@api_view(['GET'])
def api_user_status(request):
    if request.user.is_authenticated:
        # Ensure profile exists
        profile, created = Profile.objects.get_or_create(user=request.user, defaults={'role': 'STAFF'})
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

# ==========================================
# PUBLIC & GENERAL ENDPOINTS
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_departments(request):
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_department_detail(request, code):
    department = get_object_or_404(Department, code=code)
    serializer = DepartmentSerializer(department)
    
    # Collect related items
    faculties = Faculty.objects.filter(department=department).order_by('-is_hod', 'name')
    labs = Laboratory.objects.filter(department=department)
    events = Event.objects.filter(department=department).order_by('-date')
    notices = Notice.objects.filter(department=department, is_active=True).order_by('-date')
    placements = Placement.objects.filter(department=department).order_by('-year', 'student_name')
    visits = IndustrialVisit.objects.filter(department=department).order_by('-date')
    gallery = GalleryImage.objects.filter(department=department)
    downloads = Download.objects.filter(department=department)
    newsletters = Newsletter.objects.filter(department=department, status='APPROVED').order_by('-publish_date')
    workshops = Workshop.objects.filter(department=department).order_by('-date')
    seminars = Seminar.objects.filter(department=department).order_by('-date')
    student_achievements = StudentAchievement.objects.filter(department=department)
    faculty_achievements = FacultyAchievement.objects.filter(department=department)

    return Response({
        "department": serializer.data,
        "faculties": FacultySerializer(faculties, many=True).data,
        "labs": LaboratorySerializer(labs, many=True).data,
        "events": EventSerializer(events, many=True).data,
        "notices": NoticeSerializer(notices, many=True).data,
        "placements": PlacementSerializer(placements, many=True).data,
        "visits": IndustrialVisitSerializer(visits, many=True).data,
        "gallery": GalleryImageSerializer(gallery, many=True).data,
        "downloads": DownloadSerializer(downloads, many=True).data,
        "newsletters": NewsletterSerializer(newsletters, many=True).data,
        "workshops": WorkshopSerializer(workshops, many=True).data,
        "seminars": SeminarSerializer(seminars, many=True).data,
        "student_achievements": StudentAchievementSerializer(student_achievements, many=True).data,
        "faculty_achievements": FacultyAchievementSerializer(faculty_achievements, many=True).data,
    })

# Submit Contact Message
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_contact(request):
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Message submitted successfully!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Public Newsletter search / list
@api_view(['GET'])
@permission_classes([AllowAny])
def public_newsletters(request):
    query = request.query_params.get('search', '')
    newsletters = Newsletter.objects.filter(status='APPROVED').order_by('-publish_date')
    if query:
        newsletters = newsletters.filter(
            Q(title__icontains=query) | 
            Q(description__icontains=query) | 
            Q(department__name__icontains=query)
        )
    serializer = NewsletterSerializer(newsletters, many=True)
    return Response(serializer.data)

# ==========================================
# STAFF & ADMIN CRUD ENDPOINTS (Unified)
# ==========================================

# Generic view to add models under a department
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def add_department_item(request, dept_id, model_type):
    if not is_staff_for_dept(request.user, dept_id):
        return Response({"error": "Unauthorized to edit this department."}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data.copy()
    data['department'] = int(dept_id)

    # Resolve serializer by model_type
    serializers_map = {
        'faculty': FacultySerializer,
        'labs': LaboratorySerializer,
        'events': EventSerializer,
        'workshops': WorkshopSerializer,
        'seminars': SeminarSerializer,
        'visits': IndustrialVisitSerializer,
        'placements': PlacementSerializer,
        'gallery': GalleryImageSerializer,
        'notices': NoticeSerializer,
        'downloads': DownloadSerializer,
        'student_achievements': StudentAchievementSerializer,
        'faculty_achievements': FacultyAchievementSerializer,
        'newsletters': NewsletterSerializer,
    }

    if model_type not in serializers_map:
        return Response({"error": "Invalid resource type"}, status=status.HTTP_400_BAD_REQUEST)

    # Force pending status for newsletters created by staff
    if model_type == 'newsletters' and not is_super_admin(request.user):
        data['status'] = 'PENDING'

    serializer_class = serializers_map[model_type]
    serializer = serializer_class(data=data)
    
    if serializer.is_valid():
        obj = serializer.save()
        log_user_action(request.user, f"Added {model_type} item: {str(obj)}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Update or Delete items
@api_view(['PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def manage_department_item(request, model_type, item_id):
    models_map = {
        'faculty': (Faculty, FacultySerializer),
        'labs': (Laboratory, LaboratorySerializer),
        'events': (Event, EventSerializer),
        'workshops': (Workshop, WorkshopSerializer),
        'seminars': (Seminar, SeminarSerializer),
        'visits': (IndustrialVisit, IndustrialVisitSerializer),
        'placements': (Placement, PlacementSerializer),
        'gallery': (GalleryImage, GalleryImageSerializer),
        'notices': (Notice, NoticeSerializer),
        'downloads': (Download, DownloadSerializer),
        'student_achievements': (StudentAchievement, StudentAchievementSerializer),
        'faculty_achievements': (FacultyAchievement, FacultyAchievementSerializer),
        'newsletters': (Newsletter, NewsletterSerializer),
    }

    if model_type not in models_map:
        return Response({"error": "Invalid resource type"}, status=status.HTTP_400_BAD_REQUEST)

    model_class, serializer_class = models_map[model_type]
    obj = get_object_or_404(model_class, id=item_id)
    
    # Check permission
    if not is_staff_for_dept(request.user, obj.department.id):
        return Response({"error": "Unauthorized to edit this department's data."}, status=status.HTTP_430_FORBIDDEN or status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        log_user_action(request.user, f"Deleted {model_type} item: {str(obj)}")
        obj.delete()
        return Response({"message": "Deleted successfully"}, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        data = request.data.copy()
        data['department'] = obj.department.id
        
        # Newsletters edited by staff go back to pending unless edited by super admin
        if model_type == 'newsletters' and not is_super_admin(request.user):
            data['status'] = 'PENDING'

        # Allow partial updates
        serializer = serializer_class(obj, data=data, partial=True)
        if serializer.is_valid():
            updated_obj = serializer.save()
            log_user_action(request.user, f"Updated {model_type} item: {str(updated_obj)}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Update Department overview / Vision / Mission
@api_view(['PUT'])
@parser_classes([MultiPartParser, FormParser])
def update_department_details(request, dept_id):
    if not is_staff_for_dept(request.user, dept_id):
        return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
    
    dept = get_object_or_404(Department, id=dept_id)
    serializer = DepartmentSerializer(dept, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        log_user_action(request.user, f"Updated department info for {dept.code}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==========================================
# SUPER ADMIN SPECIFIC APIS
# ==========================================

# Super Admin Newsletter Approvals
@api_view(['GET'])
def get_pending_newsletters(request):
    if not is_super_admin(request.user):
        return Response({"error": "Super Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    
    newsletters = Newsletter.objects.filter(status='PENDING').order_by('-publish_date')
    serializer = NewsletterSerializer(newsletters, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def review_newsletter(request, nl_id):
    if not is_super_admin(request.user):
        return Response({"error": "Super Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    
    newsletter = get_object_or_404(Newsletter, id=nl_id)
    review_action = request.data.get('action') # 'APPROVE' or 'REJECT'
    
    if review_action == 'APPROVE':
        newsletter.status = 'APPROVED'
        newsletter.publish_date = timezone.now().date()
        newsletter.save()
        log_user_action(request.user, f"Approved newsletter: {newsletter.title}")
        return Response({"message": "Newsletter approved and published!"})
    elif review_action == 'REJECT':
        newsletter.status = 'REJECTED'
        newsletter.save()
        log_user_action(request.user, f"Rejected newsletter: {newsletter.title}")
        return Response({"message": "Newsletter rejected."})
    else:
        return Response({"error": "Invalid action. Use 'APPROVE' or 'REJECT'"}, status=status.HTTP_400_BAD_REQUEST)

# Super Admin Dashboard / Analytics API
@api_view(['GET'])
def get_admin_dashboard_stats(request):
    if not is_super_admin(request.user):
        return Response({"error": "Super Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    
    # 1. Broad counts
    stats = {
        "total_departments": Department.objects.count(),
        "total_faculty": Faculty.objects.count(),
        "total_newsletters": Newsletter.objects.count(),
        "total_published_newsletters": Newsletter.objects.filter(status='APPROVED').count(),
        "total_pending_newsletters": Newsletter.objects.filter(status='PENDING').count(),
        "total_events": Event.objects.count(),
        "total_notices": Notice.objects.count(),
        "total_downloads": Download.objects.count()
    }
    
    # 2. Activity Logs (recent 15)
    logs = ActivityLog.objects.order_by('-timestamp')[:15]
    stats['recent_activities'] = ActivityLogSerializer(logs, many=True).data

    # 3. Department-wise stats for charts
    departments = Department.objects.all()
    dept_stats = []
    for dept in departments:
        dept_stats.append({
            "name": dept.name,
            "code": dept.code,
            "faculties_count": Faculty.objects.filter(department=dept).count(),
            "newsletters_count": Newsletter.objects.filter(department=dept, status='APPROVED').count(),
            "events_count": Event.objects.filter(department=dept).count(),
            "placements_count": Placement.objects.filter(department=dept).count()
        })
    stats['department_wise_stats'] = dept_stats

    # 4. Contact messages (recent 10)
    messages = ContactMessage.objects.order_by('-submitted_at')[:10]
    stats['contact_messages'] = ContactMessageSerializer(messages, many=True).data
    
    return Response(stats)

# Super Admin Manage Departments
@api_view(['POST', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def admin_manage_department(request, dept_id=None):
    if not is_super_admin(request.user):
        return Response({"error": "Super Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        
    if request.method == 'POST':
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            dept = serializer.save()
            log_user_action(request.user, f"Created department: {dept.name} ({dept.code})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    dept = get_object_or_404(Department, id=dept_id)
    
    if request.method == 'DELETE':
        log_user_action(request.user, f"Deleted department: {dept.name} ({dept.code})")
        dept.delete()
        return Response({"message": "Department deleted successfully"})
        
    elif request.method == 'PUT':
        serializer = DepartmentSerializer(dept, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_user_action(request.user, f"Updated department settings: {dept.code}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Super Admin Manage Staff Accounts
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def admin_manage_staff(request, staff_id=None):
    if not is_super_admin(request.user):
        return Response({"error": "Super Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        staff_profiles = Profile.objects.filter(role='STAFF')
        users_data = []
        for profile in staff_profiles:
            users_data.append(UserSerializer(profile.user).data)
        return Response(users_data)

    elif request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        dept_id = request.data.get('department') # ID of department

        if not username or not password or not dept_id:
            return Response({"error": "Username, password and department are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        dept = get_object_or_404(Department, id=dept_id)
        user = User.objects.create_user(username=username, password=password, email=email)
        Profile.objects.create(user=user, role='STAFF', department=dept)
        
        log_user_action(request.user, f"Created staff account '{username}' for {dept.code}")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        user = get_object_or_404(User, id=staff_id)
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        dept_id = request.data.get('department')

        if username:
            user.username = username
        if email:
            user.email = email
        if password:
            user.set_password(password)
        user.save()

        if dept_id:
            dept = get_object_or_404(Department, id=dept_id)
            profile = user.profile
            profile.department = dept
            profile.save()

        log_user_action(request.user, f"Modified staff account '{user.username}'")
        return Response(UserSerializer(user).data)

    elif request.method == 'DELETE':
        user = get_object_or_454(User, id=staff_id)
        if user.is_superuser:
            return Response({"error": "Cannot delete superuser."}, status=status.HTTP_400_BAD_REQUEST)
        log_user_action(request.user, f"Deleted staff account '{user.username}'")
        user.delete()
        return Response({"message": "Staff user deleted successfully."})

# Export Data / Mock Backup API
@api_view(['GET'])
def backup_database(request):
    if not is_super_admin(request.user):
        return Response({"error": "Super Admin access required."}, status=status.HTTP_403_FORBIDDEN)
    
    # We will bundle key data in a JSON structure
    backup_data = {
        "departments": DepartmentSerializer(Department.objects.all(), many=True).data,
        "faculty": FacultySerializer(Faculty.objects.all(), many=True).data,
        "newsletters": NewsletterSerializer(Newsletter.objects.all(), many=True).data,
        "events": EventSerializer(Event.objects.all(), many=True).data,
        "notices": NoticeSerializer(Notice.objects.all(), many=True).data,
        "placements": PlacementSerializer(Placement.objects.all(), many=True).data,
        "activities": ActivityLogSerializer(ActivityLog.objects.order_by('-timestamp')[:50], many=True).data,
        "backup_date": timezone.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    log_user_action(request.user, "Downloaded system database backup.")
    
    response = Response(backup_data)
    response['Content-Disposition'] = 'attachment; filename=dkte_ycp_database_backup.json'
    return response
