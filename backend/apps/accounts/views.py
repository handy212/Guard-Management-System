from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import Permission, Role
from .serializers import CurrentUserSerializer, LoginSerializer, PermissionSerializer, RoleSerializer, UserSerializer


class AuthLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": CurrentUserSerializer(user).data,
            }
        )


class AuthLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuthMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class PermissionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permission_class("settings.manage")]


class RoleViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Role.objects.prefetch_related("permissions")
    serializer_class = RoleSerializer
    permission_classes = [permission_class("settings.manage")]


class UserViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = get_user_model().objects.select_related("role", "client")
    serializer_class = UserSerializer
    permission_classes = [permission_class("settings.manage")]
