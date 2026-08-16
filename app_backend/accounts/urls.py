from django.urls import path
from django.conf import settings
from django.conf.urls.static import static


from .views import (
    RegisterView,
    ProfileView,
    EditProfileView,
    DiscoverView,
    ConnectionRequestView,
)
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView

urlpatterns = [
    # --------------------------
    # Auth
    # --------------------------
    path("register/", RegisterView.as_view(), name="register"),
    
    # --------------------------
    # Profile
    # --------------------------
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/edit/", EditProfileView.as_view(), name="edit-profile"),

    # --------------------------
    # Discover page
    # --------------------------
    path("discover/", DiscoverView.as_view(), name="discover"),

    # --------------------------
    # Connection requests (connect/pass)
    # POST → send request
    # PATCH → accept/reject request
    # --------------------------
    path("connect/<int:user_id>/", ConnectionRequestView.as_view(), name="connection-request"),
]
urlpatterns+= static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

