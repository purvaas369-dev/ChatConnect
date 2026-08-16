from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import ConnectionRequest

User = get_user_model()


# -------------------------------
# REGISTER SERIALIZER
# -------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


# -------------------------------
# USER SERIALIZER (basic info)
# -------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile_picture', 'bio', 'age', 'city', 'last_seen', 'is_online')


# -------------------------------
# PROFILE SERIALIZER (view/edit)
# -------------------------------
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'profile_picture', 'bio', 'age', 'city')
        read_only_fields = ('username', 'email')  # Username/email cannot be edited


# -------------------------------
# CONNECTION REQUEST SERIALIZER
# -------------------------------
class ConnectionRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ('id', 'sender', 'receiver', 'status', 'timestamp')
