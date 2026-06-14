using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SuperSocket.SocketBase;
using SuperSocket.SocketBase.Command;

namespace SuperSocket.QuickStart.GPRSSocketServer
{
    public class GPRSSession : AppSession<GPRSSession, BinaryCommandInfo>
    {
        public new GPRSServer AppServer
        {
            get
            {
                return (GPRSServer)base.AppServer;
            }
        }
    }
}
