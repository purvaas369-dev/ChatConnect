
from django.urls import path
from . import views

urlpatterns = [
    path("rooms/", views.ChatRoomView.as_view()),
    path("messages/<int:room_id>/",views.MessageListView.as_view()),
    path("upload/", views.FileUploadView.as_view()),
    path("notifications/",views.NotificationListView.as_view()),
    path('discover/users/', views.discover_users),
    path('discover/connect/', views.connect_request),
    path('notification_count/',views.notification_count),
    path('notifications/read/',views.mark_notifications_read),
    path('notifications/<int:id>/read/', views.mark_single_notification_read),
    path('create-room/', views.create_chat_room),
    path('ai-matches-enhanced/', views.get_enhanced_ai_matches, name='ai_matches_enhanced'),
    path('ai-auto-connect/', views.ai_auto_connect, name='ai_auto_connect'),
    path('ai-match-check/<int:target_id>/', views.is_ai_match, name='is_ai_match'),

]

