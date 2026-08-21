from django.urls import path
from django.views.generic import TemplateView
from core import views

urlpatterns = [
    # Frontend SPA Entry point
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Auth APIs
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/status/', views.api_user_status, name='api_user_status'),
    
    # Public & general endpoints
    path('api/departments/', views.get_departments, name='get_departments'),
    path('api/departments/<str:code>/', views.get_department_detail, name='get_department_detail'),
    path('api/contact/', views.submit_contact, name='submit_contact'),
    path('api/newsletters/', views.public_newsletters, name='public_newsletters'),
    
    # Staff / Admin endpoints
    path('api/departments/<int:dept_id>/update/', views.update_department_details, name='update_department_details'),
    path('api/departments/<int:dept_id>/add/<str:model_type>/', views.add_department_item, name='add_department_item'),
    path('api/items/<str:model_type>/<int:item_id>/', views.manage_department_item, name='manage_department_item'),
    
    # Super Admin specific endpoints
    path('api/admin/newsletters/pending/', views.get_pending_newsletters, name='get_pending_newsletters'),
    path('api/admin/newsletters/<int:nl_id>/review/', views.review_newsletter, name='review_newsletter'),
    path('api/admin/stats/', views.get_admin_dashboard_stats, name='get_admin_dashboard_stats'),
    path('api/admin/departments/', views.admin_manage_department, name='admin_manage_department_create'),
    path('api/admin/departments/<int:dept_id>/', views.admin_manage_department, name='admin_manage_department'),
    path('api/admin/staff/', views.admin_manage_staff, name='admin_manage_staff_list_create'),
    path('api/admin/staff/<int:staff_id>/', views.admin_manage_staff, name='admin_manage_staff'),
    path('api/admin/backup/', views.backup_database, name='backup_database'),
]
