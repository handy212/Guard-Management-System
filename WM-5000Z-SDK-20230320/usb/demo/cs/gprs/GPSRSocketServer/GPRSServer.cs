using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SuperSocket.SocketBase.Command;
using SuperSocket.SocketBase;
using SuperSocket.SocketEngine.Configuration;
using System.Configuration;

namespace SuperSocket.QuickStart.GPRSSocketServer
{
    public class GPRSServer : AppServer<GPRSSession, BinaryCommandInfo>
    {
        public GPRSServer()
            : base(new GPRSCustomProtocol())
        {
            //do somthing 
            //eg.connect to database
        }
        ~GPRSServer()
        {
     
        }        
     
    }
}
