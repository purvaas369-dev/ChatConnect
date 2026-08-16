# chat/ai_recommendations.py - FREE AI
import random
from django.contrib.auth import get_user_model

User = get_user_model()

class FreeAIRecommender:
    def get_ai_matches(self, current_user, all_users, top_n=3):
        """🤖 Smart matching - interests + age + location"""
        matches = []
        for user in all_users:
            if user.id != current_user.id:
                score = self._calculate_score(current_user, user)
                if score > 50:  # Only good matches
                    user.ai_score = int(score)
                    user.ai_message = self._generate_message(current_user, user)
                    matches.append(user)
        
        # Sort by score
        matches.sort(key=lambda x: x.ai_score, reverse=True)
        return matches[:top_n]
    
    def _calculate_score(self, user1, user2):
        score = 0
        
        # Age match (30 pts)
        age_diff = abs(getattr(user2, 'age', 25) - getattr(user1, 'age', 25))
        if age_diff <= 3: score += 30
        elif age_diff <= 7: score += 20

        # City match (30 pts)
        if getattr(user1, 'city', '') == getattr(user2, 'city', ''):
            score += 30
        
        # Online bonus (20 pts)
        if getattr(user2, 'is_online', False):
            score += 20
        
        return min(score, 100)
    
    def _generate_message(self, current_user, target_user):
        name = target_user.username.split()[0]
        city = getattr(target_user,'city','area')
        
        messages = [
            f"Hey {name}! Fellow {city} person? 😊",
            f"Hi {name}! Your profile looks great! ✨",
            f"{name}! New here? Let's chat! 👋"
        ]
        return random.choice(messages)