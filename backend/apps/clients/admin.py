from django.contrib import admin

from .models import Client, ClientContact, ClientContract

admin.site.register(Client)
admin.site.register(ClientContact)
admin.site.register(ClientContract)
