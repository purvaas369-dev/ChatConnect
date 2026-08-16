# chat/middleware.py
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs, unquote

class JWTAuthMiddleware(BaseMiddleware):
    """
    🔑 Parse ?token=... from WS query string
    """
    async def __call__(self, scope, receive, send):
        # ✅ Extract token from ?token=...
        query_string = scope.get('query_string', b'').decode()
        print(f"🔍 FULL QUERY: {query_string}")
        # token = None

        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # for param in query_string.split('&'):
        #     if param.startswith('token='):
        #         token = param[6:]  # token=abc → abc
        #         break
        
        print(f"🔍 Query token: {'YES' if token else 'NO'} ({len(token) if token else 0} chars)")
        
        if token:
            token = unquote(token)  # ✅ Decode %20 → space
            print(f"🔍 DECODED: {token[:30]}... ({len(token)} chars)")
            try:
                token_data = UntypedToken(token)
                user_id = token_data['user_id']
                scope['user'] = await self.__get_user(user_id)
                print(f"✅ JWT user_id: {user_id}")
            except (InvalidToken, TokenError, KeyError) as e:
                print(f"❌ JWT ERROR: {e}")
                scope['user'] = AnonymousUser()
        else:
            print("❌ No token in query")
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def __get_user(self, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            return User.objects.get(id=user_id)
        except:
            from django.contrib.auth.models import AnonymousUser
            return AnonymousUser()