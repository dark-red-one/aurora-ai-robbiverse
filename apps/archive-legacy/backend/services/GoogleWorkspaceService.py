"""
Google Workspace Service - Docs, Sheets, Slides ONLY! 📄📊📽️
NO Microsoft Office - We're a Google Apps company! [[memory:9670808]]
"""

import os
import json
from typing import List, Dict, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import psycopg2
import psycopg2.extras

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "/home/allan/aurora-ai-robbiverse/secrets/google-credentials.json")

# Scopes for Google Workspace APIs
SCOPES = [
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/presentations.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file'
]

class GoogleWorkspaceService:
    """
    Manage Google Workspace files (Docs, Sheets, Slides)
    Link them to sticky notes, manage sharing
    """
    
    def __init__(self):
        self.db = psycopg2.connect(DATABASE_URL)
        self.credentials = None
        self.docs_service = None
        self.sheets_service = None
        self.slides_service = None
        self.drive_service = None
        self._init_services()
    
    def _init_services(self):
        """Initialize Google API services"""
        try:
            if os.path.exists(GOOGLE_CREDENTIALS_PATH):
                self.credentials = service_account.Credentials.from_service_account_file(
                    GOOGLE_CREDENTIALS_PATH,
                    scopes=SCOPES
                )
                
                self.docs_service = build('docs', 'v1', credentials=self.credentials)
                self.sheets_service = build('sheets', 'v4', credentials=self.credentials)
                self.slides_service = build('slides', 'v1', credentials=self.credentials)
                self.drive_service = build('drive', 'v3', credentials=self.credentials)
            else:
                print(f"⚠️ Google credentials not found at {GOOGLE_CREDENTIALS_PATH}")
        except Exception as e:
            print(f"⚠️ Failed to initialize Google services: {e}")
    
    def link_doc_to_note(self, note_id: str, doc_url: str, file_type: str = 'doc') -> Dict:
        """
        Link a Google Doc/Sheet/Slide to a sticky note
        Validates it's actually a Google Workspace file (no MS Office!)
        """
        # Extract file ID from URL
        file_id = self._extract_file_id(doc_url)
        if not file_id:
            return {"error": "Invalid Google Workspace URL"}
        
        # Validate file type
        if file_type not in ['doc', 'sheet', 'slide', 'drive']:
            return {"error": "Only Google Docs, Sheets, and Slides allowed (no Microsoft Office!)"}
        
        try:
            # Get file metadata
            file_metadata = self.drive_service.files().get(
                fileId=file_id,
                fields='id,name,mimeType,modifiedTime,webViewLink,owners,permissions'
            ).execute()
            
            # Validate it's actually a Google Workspace file
            mime_type = file_metadata.get('mimeType', '')
            if not self._is_google_workspace_file(mime_type):
                return {
                    "error": "Not a Google Workspace file! We only use Google Docs, Sheets, and Slides (no Word/Excel/PowerPoint!)",
                    "mime_type": mime_type
                }
            
            # Store in database
            cursor = self.db.cursor()
            cursor.execute("""
                INSERT INTO google_workspace_links 
                (note_id, link_type, file_id, file_name, file_url, last_modified)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (note_id, file_id) 
                DO UPDATE SET 
                    file_name = EXCLUDED.file_name,
                    last_modified = EXCLUDED.last_modified,
                    updated_at = NOW()
                RETURNING id
            """, (
                note_id,
                file_type,
                file_id,
                file_metadata['name'],
                file_metadata['webViewLink'],
                file_metadata['modifiedTime']
            ))
            
            link_id = cursor.fetchone()[0]
            self.db.commit()
            cursor.close()
            
            return {
                "success": True,
                "link_id": str(link_id),
                "file_name": file_metadata['name'],
                "file_url": file_metadata['webViewLink'],
                "file_type": self._get_friendly_type(mime_type)
            }
            
        except HttpError as e:
            return {"error": f"Google API error: {str(e)}"}
        except Exception as e:
            return {"error": f"Failed to link file: {str(e)}"}
    
    def _extract_file_id(self, url: str) -> Optional[str]:
        """Extract Google file ID from URL"""
        import re
        
        # Match various Google URL formats
        patterns = [
            r'/d/([a-zA-Z0-9-_]+)',  # /d/FILE_ID
            r'id=([a-zA-Z0-9-_]+)',  # ?id=FILE_ID
            r'/spreadsheets/d/([a-zA-Z0-9-_]+)',
            r'/presentation/d/([a-zA-Z0-9-_]+)',
            r'/document/d/([a-zA-Z0-9-_]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def _is_google_workspace_file(self, mime_type: str) -> bool:
        """Validate it's a Google Workspace file (not MS Office!)"""
        google_types = [
            'application/vnd.google-apps.document',      # Google Docs
            'application/vnd.google-apps.spreadsheet',   # Google Sheets
            'application/vnd.google-apps.presentation',  # Google Slides
            'application/vnd.google-apps.folder',        # Google Drive folder
            'application/vnd.google-apps.form'           # Google Forms
        ]
        
        # EXPLICITLY REJECT Microsoft Office formats
        microsoft_types = [
            'application/msword',                        # .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
            'application/vnd.ms-excel',                  # .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # .xlsx
            'application/vnd.ms-powerpoint',             # .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'  # .pptx
        ]
        
        if mime_type in microsoft_types:
            return False
        
        return mime_type in google_types
    
    def _get_friendly_type(self, mime_type: str) -> str:
        """Get friendly name for file type"""
        type_map = {
            'application/vnd.google-apps.document': 'Google Doc 📄',
            'application/vnd.google-apps.spreadsheet': 'Google Sheets 📊',
            'application/vnd.google-apps.presentation': 'Google Slides 📽️',
            'application/vnd.google-apps.folder': 'Google Drive Folder 📁',
            'application/vnd.google-apps.form': 'Google Form 📋'
        }
        return type_map.get(mime_type, 'Google Workspace File')
    
    def share_file(self, file_id: str, email: str, role: str = 'reader') -> Dict:
        """
        Share a Google Workspace file with someone
        Roles: reader, writer, commenter
        """
        try:
            permission = {
                'type': 'user',
                'role': role,
                'emailAddress': email
            }
            
            result = self.drive_service.permissions().create(
                fileId=file_id,
                body=permission,
                sendNotificationEmail=True
            ).execute()
            
            # Update database
            cursor = self.db.cursor()
            cursor.execute("""
                UPDATE google_workspace_links
                SET shared_with = array_append(shared_with, %s),
                    updated_at = NOW()
                WHERE file_id = %s
            """, (email, file_id))
            self.db.commit()
            cursor.close()
            
            return {
                "success": True,
                "permission_id": result.get('id'),
                "shared_with": email,
                "role": role,
                "message": f"✅ Shared with {email} ({role} access)"
            }
            
        except HttpError as e:
            return {"error": f"Failed to share: {str(e)}"}
    
    def unshare_file(self, file_id: str, email: str) -> Dict:
        """
        Unshare a Google Workspace file (revoke access)
        This is key to our workflow: share → work → unshare!
        """
        try:
            # Get all permissions for the file
            permissions = self.drive_service.permissions().list(
                fileId=file_id,
                fields='permissions(id,emailAddress)'
            ).execute()
            
            # Find the permission for this email
            permission_id = None
            for perm in permissions.get('permissions', []):
                if perm.get('emailAddress') == email:
                    permission_id = perm.get('id')
                    break
            
            if not permission_id:
                return {"error": f"No permission found for {email}"}
            
            # Delete the permission
            self.drive_service.permissions().delete(
                fileId=file_id,
                permissionId=permission_id
            ).execute()
            
            # Update database
            cursor = self.db.cursor()
            cursor.execute("""
                UPDATE google_workspace_links
                SET shared_with = array_remove(shared_with, %s),
                    updated_at = NOW()
                WHERE file_id = %s
            """, (email, file_id))
            self.db.commit()
            cursor.close()
            
            return {
                "success": True,
                "message": f"✅ Revoked access for {email}",
                "unshared_with": email
            }
            
        except HttpError as e:
            return {"error": f"Failed to unshare: {str(e)}"}
    
    def get_file_preview(self, file_id: str) -> Dict:
        """Get file preview info (title, thumbnail, last modified)"""
        try:
            file_metadata = self.drive_service.files().get(
                fileId=file_id,
                fields='id,name,mimeType,modifiedTime,webViewLink,thumbnailLink,iconLink,owners,shared,permissions'
            ).execute()
            
            return {
                "success": True,
                "name": file_metadata.get('name'),
                "type": self._get_friendly_type(file_metadata.get('mimeType')),
                "url": file_metadata.get('webViewLink'),
                "thumbnail": file_metadata.get('thumbnailLink'),
                "icon": file_metadata.get('iconLink'),
                "last_modified": file_metadata.get('modifiedTime'),
                "shared": file_metadata.get('shared', False),
                "shared_with": [p.get('emailAddress') for p in file_metadata.get('permissions', []) if p.get('emailAddress')]
            }
            
        except HttpError as e:
            return {"error": f"Failed to get preview: {str(e)}"}
    
    def get_links_for_note(self, note_id: str) -> List[Dict]:
        """Get all Google Workspace links for a sticky note"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT * FROM google_workspace_links
            WHERE note_id = %s
            ORDER BY created_at DESC
        """, (note_id,))
        
        links = cursor.fetchall()
        cursor.close()
        
        # Enrich with live preview data
        enriched = []
        for link in links:
            preview = self.get_file_preview(link['file_id'])
            if preview.get('success'):
                enriched.append({
                    **dict(link),
                    'live_preview': preview
                })
            else:
                enriched.append(dict(link))
        
        return enriched
    
    def validate_no_microsoft_office(self, url: str) -> Dict:
        """
        Validate URL is NOT a Microsoft Office file
        Helper function to enforce Google Workspace only!
        """
        file_id = self._extract_file_id(url)
        if not file_id:
            return {"valid": False, "error": "Not a Google Workspace URL"}
        
        try:
            file_metadata = self.drive_service.files().get(
                fileId=file_id,
                fields='mimeType,name'
            ).execute()
            
            mime_type = file_metadata.get('mimeType')
            
            if not self._is_google_workspace_file(mime_type):
                return {
                    "valid": False,
                    "error": f"❌ This is NOT a Google Workspace file! We only use Google Docs, Sheets, and Slides. No Word/Excel/PowerPoint!",
                    "file_name": file_metadata.get('name'),
                    "file_type": mime_type
                }
            
            return {
                "valid": True,
                "message": f"✅ Valid Google Workspace file: {self._get_friendly_type(mime_type)}",
                "file_name": file_metadata.get('name'),
                "file_type": self._get_friendly_type(mime_type)
            }
            
        except HttpError as e:
            return {"valid": False, "error": f"Failed to validate: {str(e)}"}


# Convenience functions
def link_google_doc(note_id: str, doc_url: str) -> Dict:
    """Quick function to link a Google Doc/Sheet/Slide to a note"""
    service = GoogleWorkspaceService()
    return service.link_doc_to_note(note_id, doc_url)

def share_with(file_id: str, email: str) -> Dict:
    """Quick function to share a file"""
    service = GoogleWorkspaceService()
    return service.share_file(file_id, email)

def unshare_with(file_id: str, email: str) -> Dict:
    """Quick function to unshare a file"""
    service = GoogleWorkspaceService()
    return service.unshare_file(file_id, email)

def no_microsoft_office_check(url: str) -> bool:
    """Quick check: Is this a Google Workspace file? (No MS Office!)"""
    service = GoogleWorkspaceService()
    result = service.validate_no_microsoft_office(url)
    return result.get('valid', False)




