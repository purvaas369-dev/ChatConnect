from chat.models import Notification
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import ChatRoom, ChatMessage,Notification
from accounts.models import User
from .serializers import UserSerializer,NotificationSerializer
from channels.layers import get_channel_layer  # ✅ ADD THIS
from asgiref.sync import async_to_sync  
from .ai_recommendation import FreeAIRecommender
from django.utils import timezone                 # 👈 Has timedelta!
from datetime import timedelta    


# -------------------------------
# GET ALL CHAT ROOMS
# -------------------------------
class ChatRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        rooms = ChatRoom.objects.filter(participants=user)

        data = []
        for room in rooms:
            other_user = room.participants.exclude(id=user.id).first()

            data.append({
                "id": room.id,
                "other_user": {
                    "id": other_user.id,
                    "username": other_user.username,
                    "profile_picture": other_user.profile_picture.url if other_user.profile_picture else None,
                    "is_online": getattr(other_user, "is_online", False),
                    "last_seen": getattr(other_user, "last_seen", None),
                },
                "is_paid":room.is_paid
            })

        return Response(data)


# -------------------------------
# GET MESSAGES OF A ROOM
# -------------------------------
class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        user = request.user

        messages = ChatMessage.objects.filter(room_id=room_id).order_by('timestamp')

        data = []
        for msg in messages:
            data.append({
                "id": msg.id,
                "message": msg.message,
                "file": msg.file.url if msg.file else None,
                "sender": msg.sender.id,
                "username": msg.sender.username,
                "is_me": msg.sender == user,
                "timestamp": msg.timestamp,
                "is_seen": msg.is_seen
            })

        return Response(data)


# -------------------------------
# FILE UPLOAD
# -------------------------------
class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file provided"}, status=400)
        
        room_id = request.data.get("room_id")
        if not room_id:
            return Response({"error": "room_id required"}, status=400)

        message = ChatMessage.objects.create(
            sender=request.user,
            room_id=room_id,
            file=file,
            message_type="image"
        )
        return Response({
            "file":message.file.url
        })
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).select_related('sender', 'room')[:10]
        data = []
        for n in notifications:
            sender_profile_pic = None
            if n.sender:
                if hasattr(n.sender, 'profile_picture') and n.sender.profile_picture:
                    sender_profile_pic = n.sender.profile_picture.url
                else:
                    sender_profile_pic = None
            data.append({
                "id": n.id,
                "message": n.message,
                "sender_id": n.sender.id if n.sender else None,  # 👈 ENSURE THIS!**
                "sender_username": n.sender.username if n.sender else "Unknown",
                "sender_name": n.sender.username if n.sender else None,
                "profile_picture": n.sender.profile_picture.url if n.sender and n.sender.profile_picture else None, 
                "room_id": n.room.id if n.room else None,
                "is_read": n.is_read,
                "created_at": n.created_at,
                "type": n.type,
            })
        print("🔥 Notifications sent:")  # DEBUG
        return Response(data)

from accounts.models import User, ConnectionRequest  # Add ConnectionRequest!
from rest_framework.decorators import api_view, permission_classes
from .models import User, ChatRoom, Notification
from .serializers import UserSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discover_users(request):
    users = User.objects.exclude(id=request.user.id)[:20]
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_request(request):
    """Send connection request (notification)"""
    target_id = request.data.get('target_user_id')
    try:
        target_user = User.objects.get(id=target_id)
        sender_user = request.user
    
    # Create notification for target user
        notification = Notification(
            user=target_user,
            sender=sender_user,
            message=f"{sender_user.username} wants to connect with you! 💬",
            type='connection_request'
    )
        notification.save()
        print(f"✅ Notification created: ID={notification.id}, sender={request.user.id}")
        # ✅ FIXED - Real-time notification
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifications_{target_user.id}',
            {
                'type': 'new_notification',
                'count': target_user.notifications.filter(is_read=False).count()
            }
        )
        return Response({"message": "Connection request sent!"})
    except User.DoesNotExist:
        return Response({"error":"User not found"},status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_count(request):
    """Get unread notification count"""
    count = Notification.objects.filter(
        user=request.user, 
        is_read=False
    ).count()
    return Response({'unread_count': count})
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """Mark all notifications as read"""
    Notification.objects.filter(
        user=request.user,
        is_read=False
    ).update(is_read=True)

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f'notifications_{request.user.id}',
    {
        'type': 'new_notification',
        'count': 0
    }
)   
    return Response({"message": "Marked as read"})
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_single_notification_read(request, id):   # ✅ match URL
    try:
        notification = Notification.objects.get(id=id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({"message": "Marked as read"})
    except Notification.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat_room(request):
    user = request.user
    other_user_id = request.data.get('other_user_id')
    
    print(f"🔥 Creating room: user={user.id}, other={other_user_id}")  # DEBUG
    
    if not other_user_id:
        return Response({"error": "Missing other_user_id"}, status=400)
    
    try:
        other_user = User.objects.get(id=other_user_id)
        
        # Check if room already exists
        existing_rooms = ChatRoom.objects.filter(participants=user).filter(participants=other_user)
        
        if existing_rooms.exists():
            room = existing_rooms.first()
            print(f"✅ Room exists: {room.id}")
        else:
            room = ChatRoom.objects.create()
            room.participants.add(user, other_user)
            print(f"🔥 New room: {room.id}")
        
        # Mark notification as read
        Notification.objects.filter(
            user=user, 
            sender=other_user,
            type='connection_request',
            is_read=False
        ).update(is_read=True)
        
        return Response({
            "room_id": room.id,
            "success": True
        })
        
    except User.DoesNotExist:
        print(f"❌ User {other_user_id} not found")
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print(f"💥 Error: {e}")
        return Response({"error": "Server error"}, status=500)

# 🔥 ADD THESE NEW AI FUNCTIONS (Keep everything else unchanged!)

# ✅ NEW: Enhanced AI Matches (NEW USERS + SAME CITY)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enhanced_ai_matches(request):
    """AI finds NEW users from same city + scores them"""
    current_user = request.user
    my_city = current_user.city.lower() if current_user.city else None
    
    if not my_city:
        return Response([])
    
    # NEW USERS (last 7 days) from SAME CITY
    week_ago = timezone.now() - timedelta(days=7)
    sent_notifications = Notification.objects.filter(
        sender=current_user,
        type__in=['connection_request', 'ai_connection_request']
    ).values_list('user_id', flat=True)

    matches = User.objects.filter(
        city__icontains=my_city,
        date_joined__gte=week_ago
    ).exclude(id=current_user.id).exclude(
          id__in=sent_notifications
          )[:12]
    
    data = []
    for user in matches:
        hours_ago = round((timezone.now() - user.date_joined).total_seconds() / 3600, 1)
        data.append({
            'id': user.id,
            'username': user.username,
            'city': user.city,
            'age': user.age,
            'bio': (user.bio or 'New in your city! 🌆')[:60],
            "profile_picture": user.profile_picture.url if user.profile_picture else None,
            'hours_ago': hours_ago,
            # 'ai_score': 98,  # Perfect city match!
            'is_new': True
        })
    
    return Response(data)

# ✅ NEW: AI Auto-Connect (Sends to top 5 matches)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_auto_connect(request):
    """AI sends connection requests to top 5 city matches"""
    current_user = request.user
    my_city = current_user.city
    
    if not my_city:
        return Response({"error": "Set your city first!"}, status=400)
    
    week_ago = timezone.now() - timedelta(days=7)
    targets = User.objects.filter(
        city__icontains=my_city,
        date_joined__gte=week_ago
    ).exclude(id=current_user.id)[:5]
    
    
    sent = 0
    for target in targets:
        # Use YOUR existing connect_request logic!
        notification = Notification(
            user=target,
            sender=current_user,
            message=f"🤖 AI Match! {current_user.username} from {my_city} wants to chat! ✨",
            type='ai_connection_request'
        )
        notification.save()
        sent += 1
    
    return Response({
        "success": True,
        "sent": sent,
        "message": f"🤖 AI sent {sent} requests to new city users!"
    })

# ✅ NEW: Check if user is good AI match
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_ai_match(request, target_id):
    """Quick check: same city + new user?"""
    try:
        target = User.objects.get(id=target_id)
        current = request.user
        
        is_city_match = bool(current.city and target.city and 
                           current.city.lower() in target.city.lower())
        is_new = (timezone.now() - target.date_joined) < timedelta(days=7)
        
        return Response({
            "is_ai_match": is_city_match and is_new,
            "reason": "Same city + new user" if is_city_match and is_new else "Not a perfect match"
        })
    except:
        return Response({"is_ai_match": False})