from rest_framework import viewsets

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import Client, ClientContact, ClientContract
from .serializers import ClientContactSerializer, ClientContractSerializer, ClientSerializer


class ClientViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permission_class("clients.manage", read_permission="clients.view")]


class ClientContactViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = ClientContact.objects.select_related("client")
    serializer_class = ClientContactSerializer
    permission_classes = [permission_class("clients.manage", read_permission="clients.view")]


class ClientContractViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = ClientContract.objects.select_related("client")
    serializer_class = ClientContractSerializer
    permission_classes = [permission_class("clients.manage", read_permission="clients.view")]
