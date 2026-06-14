using PatrolDeviceAdapter.Models;

namespace PatrolDeviceAdapter.Services;

public interface IPatrolDeviceSdkGateway
{
    DeviceCommandResponse Execute(DeviceCommandRequest request);
}
