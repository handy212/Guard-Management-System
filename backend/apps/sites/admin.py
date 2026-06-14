from django.contrib import admin

from .models import Site, SiteEmergencyContact, SiteInstruction

admin.site.register(Site)
admin.site.register(SiteEmergencyContact)
admin.site.register(SiteInstruction)
