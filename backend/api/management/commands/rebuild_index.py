"""
Management command to rebuild the FAISS vector index.
Usage: python manage.py rebuild_index
"""
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Rebuild the FAISS vector index from Django database'

    def handle(self, *args, **options):
        from api.rag_db import initialize_faiss_index
        self.stdout.write(self.style.WARNING('Rebuilding FAISS index...'))
        try:
            vs = initialize_faiss_index()
            self.stdout.write(self.style.SUCCESS('FAISS index rebuilt successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed: {e}'))
