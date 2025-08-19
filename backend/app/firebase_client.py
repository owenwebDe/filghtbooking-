import firebase_admin
from firebase_admin import credentials, auth
from .config import settings

class FirebaseClient:
    def __init__(self):
        if not firebase_admin._apps:
            # Use a minimal configuration since we only need auth
            cred = credentials.ApplicationDefault()
            try:
                firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID
                })
            except:
                # If application default doesn't work, try without credentials
                # This will work if GOOGLE_APPLICATION_CREDENTIALS is set
                try:
                    firebase_admin.initialize_app(options={
                        'projectId': settings.FIREBASE_PROJECT_ID
                    })
                except:
                    pass
        
        self.auth = auth
    
    def get_user_by_email(self, email: str):
        try:
            return self.auth.get_user_by_email(email)
        except Exception:
            return None
    
    def get_user_by_uid(self, uid: str):
        try:
            return self.auth.get_user(uid)
        except Exception:
            return None
    
    def verify_id_token(self, id_token: str):
        try:
            return self.auth.verify_id_token(id_token)
        except Exception:
            return None
    
    def create_user(self, email: str, password: str, display_name: str = None):
        try:
            user = self.auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            return user
        except Exception as e:
            raise e

firebase_client = FirebaseClient()