from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User, ConnectionRequest
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProfileSerializer,
    ConnectionRequestSerializer,
)


# -------------------------------
# REGISTER USER
# -------------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )


# -------------------------------
# VIEW USER PROFILE
# -------------------------------
class ProfileView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# -------------------------------
# EDIT PROFILE
# -------------------------------
class EditProfileView(generics.UpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# -------------------------------
# DISCOVER PAGE (city relevance)
# -------------------------------
class DiscoverView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Same city users first
        city_users = User.objects.filter(city=user.city).exclude(id=user.id)

        # Other users
        other_users = User.objects.exclude(city=user.city).exclude(id=user.id)

        users = list(city_users) + list(other_users)

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


# -------------------------------
# CONNECTION REQUESTS
# -------------------------------
class ConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        """
        SEND REQUEST (Connect button)
        """
        if request.user.id == user_id:
            return Response(
                {"error": "You cannot send request to yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        obj, created = ConnectionRequest.objects.get_or_create(
            sender=request.user,
            receiver=receiver
        )

        if not created:
            return Response(
                {"error": "Request already sent"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ConnectionRequestSerializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, user_id):
        """
        ACCEPT / REJECT REQUEST (Pass button)
        """
        status_choice = request.data.get("status")

        if status_choice not in ["accepted", "rejected"]:
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            conn_req = ConnectionRequest.objects.get(
                sender_id=user_id,
                receiver=request.user
            )
        except ConnectionRequest.DoesNotExist:
            return Response(
                {"error": "Request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        conn_req.status = status_choice
        conn_req.save()

        serializer = ConnectionRequestSerializer(conn_req)
        return Response(serializer.data)
