from rest_framework import serializers

from .models import Client, ClientContact, ClientContract


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"


class ClientContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientContact
        fields = "__all__"


class ClientContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientContract
        fields = "__all__"
