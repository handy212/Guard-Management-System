using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SuperSocket.SocketBase.Protocol;

namespace SuperSocket.QuickStart.GPSSocketServer
{
    class DeviceFilter : ReceiveNoFilter<BinaryRequestInfo>
    {
        public DeviceFilter()
        {

        }

        protected override BinaryRequestInfo ProcessMatchedRequest(byte[] readBuffer, int offset, int length)
        {
            byte[] b = new byte[length];
            Console.WriteLine("inbox->" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            Array.Copy(readBuffer, offset, b, 0, length);
            return new BinaryRequestInfo("JWMDEVICE", b);
        }
    }
}
