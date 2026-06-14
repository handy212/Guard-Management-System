from rest_framework import serializers

from .models import ClientComplaint, IncidentReport, SupervisorInspection


class IncidentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentReport
        fields = "__all__"
        read_only_fields = ["reported_by"]

    def validate(self, attrs):
        status_value = attrs.get("status", getattr(self.instance, "status", None))
        resolved_at = attrs.get("resolved_at", getattr(self.instance, "resolved_at", None))
        if resolved_at and status_value not in [IncidentReport.Status.RESOLVED, IncidentReport.Status.CLOSED]:
            raise serializers.ValidationError({"resolved_at": "Only resolved or closed incidents can have a resolved timestamp."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated and "reported_by" not in validated_data:
            validated_data["reported_by"] = request.user
        return super().create(validated_data)


class SupervisorInspectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisorInspection
        fields = "__all__"
        read_only_fields = ["supervisor"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated and "supervisor" not in validated_data:
            validated_data["supervisor"] = request.user
        return super().create(validated_data)


class ClientComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientComplaint
        fields = "__all__"
        read_only_fields = ["submitted_by"]

    def validate(self, attrs):
        client = attrs.get("client", getattr(self.instance, "client", None))
        site = attrs.get("site", getattr(self.instance, "site", None))
        if site and client and site.client_id != client.id:
            raise serializers.ValidationError({"site": "Site must belong to the selected client."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated and "submitted_by" not in validated_data:
            validated_data["submitted_by"] = request.user
        return super().create(validated_data)
