using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SuperSocket.SocketBase;
using SuperSocket.SocketBase.Command;
using SuperSocket.SocketBase.Protocol;

namespace SuperSocket.QuickStart.GPSSocketServer
{
    public class GPSServer : AppServer<GPSSession, BinaryRequestInfo>
    {
        public GPSServer()
            : base(new DefaultReceiveFilterFactory<DeviceFilter, BinaryRequestInfo>())
        {

        }
    }
}
