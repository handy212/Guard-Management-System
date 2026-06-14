from rest_framework import serializers

from .models import ReportRequest


class ReportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRequest
        fields = "__all__"
        read_only_fields = ["requested_by", "file_url"]

    def validate(self, attrs):
        request = self.context.get("request")
        client = attrs.get("client", getattr(self.instance, "client", None))
        site = attrs.get("site", getattr(self.instance, "site", None))
        if request and request.user.is_authenticated and request.user.client_id:
            if client and client.id != request.user.client_id:
                raise serializers.ValidationError({"client": "Client portal users can only access their linked client."})
            attrs["client"] = request.user.client
        if site and client and site.client_id != client.id:
            raise serializers.ValidationError({"site": "Site must belong to the selected client."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated and "requested_by" not in validated_data:
            validated_data["requested_by"] = request.user
        return super().create(validated_data)
