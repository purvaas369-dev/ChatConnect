from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Extend default Django User
class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    bio = models.TextField(blank=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    last_seen = models.DateTimeField(default=timezone.now)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_online = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['-last_seen']


# Connection Requests / Friend Requests
class ConnectionRequest(models.Model):
    sender = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')  # Prevent multiple requests to same user

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


# Track which chat rooms have been paid
class PaidChat(models.Model):
    users = models.ManyToManyField(User)
    room_id = models.IntegerField()  # Corresponding ChatRoom ID
    paid_on = models.DateTimeField(auto_now_add=True)
    amount = models.FloatField(default=0.0)

    def __str__(self):
        return f"Room {self.room_id} Paid: {self.amount}"


# Optional: For storing discover page relevance
class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferred_cities = models.TextField(blank=True, help_text="Comma separated city names for relevance")

    def get_cities(self):
        return [c.strip() for c in self.preferred_cities.split(",") if c.strip()]
