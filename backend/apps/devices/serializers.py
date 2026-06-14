from rest_framework import serializers

from .models import PatrolDevice


class PatrolDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatrolDevice
        fields = "__all__"


class PatrolDeviceSyncSerializer(serializers.Serializer):
    clear_device_after_sync = serializers.BooleanField(required=False, default=True)


class PatrolDeviceNetworkConfigSerializer(serializers.Serializer):
    network_mode = serializers.ChoiceField(choices=["ip", "domain"], required=False, default="ip")
    ip = serializers.IPAddressField(required=False)
    domain = serializers.CharField(required=False, allow_blank=False, max_length=255)
    dns = serializers.IPAddressField(required=False)
    port = serializers.IntegerField(min_value=1, max_value=65535)
    apn = serializers.CharField(required=False, allow_blank=False, max_length=100)
    userid = serializers.CharField(required=False, allow_blank=True, max_length=100)
    password = serializers.CharField(required=False, allow_blank=True, max_length=100)
    pin1 = serializers.CharField(required=False, allow_blank=True, max_length=32)
    pin2 = serializers.CharField(required=False, allow_blank=True, max_length=32)

    def validate(self, attrs):
        network_mode = attrs.get("network_mode", "ip")
        if network_mode == "ip" and not attrs.get("ip"):
            raise serializers.ValidationError({"ip": "This field is required when network_mode is 'ip'."})
        if network_mode == "domain":
            errors = {}
            if not attrs.get("domain"):
                errors["domain"] = "This field is required when network_mode is 'domain'."
            if not attrs.get("dns"):
                errors["dns"] = "This field is required when network_mode is 'domain'."
            if errors:
                raise serializers.ValidationError(errors)
        return attrs
