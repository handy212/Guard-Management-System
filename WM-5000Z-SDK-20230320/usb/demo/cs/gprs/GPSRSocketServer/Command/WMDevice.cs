using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SuperSocket.SocketBase.Command;
using Jwm.Device.Lib2;

namespace SuperSocket.QuickStart.GPRSSocketServer.Command
{
    public class WMDevice : CommandBase<GPRSSession, BinaryCommandInfo>
    {
        public override string Name
        {
            get
            {
                return "WMDEVICE";
            }
        }

        public override void ExecuteCommand(GPRSSession session, BinaryCommandInfo commandInfo)
        {
           
            byte [] data=commandInfo.Data;
            Jwm.Device.Lib2.WmDevice wmDevice = new Jwm.Device.Lib2.WmDevice();
            List<object> dataList = wmDevice.parseData(data, data.Length);

            if (wmDevice.Devicetype == DeviceType.WM5000L5 )
               
            {

                Console.WriteLine("reader number:" + wmDevice.ReaderNumber); //reader number
                Console.WriteLine("imei:" + wmDevice.Imei);                  //imei 

                Jwm.Device.Lib2.Record record = null;
                if (dataList != null && dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {

                       record = (WM5000L5Record)dataList[i];

                        
                        Console.WriteLine("datetype:" + record.Recordtype);
                        Console.WriteLine("gurad id:" + record.GuardID); //guard nomber 
                        
                        Console.WriteLine("address id:" + record.AddressID); //address nomber
                        Console.WriteLine("readtime:" + record.ReadTime.ToString("yyyy-MM-dd HH:mm:ss")); //read time
                        Console.WriteLine("information:" + record.Information); //guard nomber 

                    }
                }

                // must send respone to reader
                session.SendResponse(wmDevice.ResponseBytes);
                Console.WriteLine(String.Format("{0},{1}", wmDevice.ResponseBytes[0], wmDevice.ResponseBytes[1]));
            }
            else if (wmDevice.Devicetype == DeviceType.WM5000P5) {
                Console.WriteLine("reader number:" + wmDevice.ReaderNumber); //reader number
                Console.WriteLine("imei:" + wmDevice.Imei);                  //imei 

                
                if (dataList != null && dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {

                        WM5000P5Record record = (WM5000P5Record)dataList[i];


                        Console.WriteLine("datetype:" + record.Recordtype);
                        Console.WriteLine("gurad id:" + record.GuardID); //guard nomber 

                        Console.WriteLine("address id:" + record.AddressID); //address nomber
                        Console.WriteLine("readtime:" + record.ReadTime.ToString("yyyy-MM-dd HH:mm:ss")); //read time
                        Console.WriteLine("information:" + record.Information); //guard nomber 
                        Console.WriteLine("longitude:" + record.Longitude); //guard nomber 
                        Console.WriteLine("latitude:" + record.Latitude); //guard nomber 
                        Console.WriteLine("satellites:"+record.Satellites);
                        Console.WriteLine("speed:" + record.Speed);

                    }
                }

                // must send respone to reader
                session.SendResponse(wmDevice.ResponseBytes);
                //Console.WriteLine(String.Format("{0},{1}", wmDevice.ResponseBytes[0], wmDevice.ResponseBytes[1]));                
                Console.WriteLine("========================================================");                
            }
            else if (wmDevice.Devicetype == DeviceType.WM5000P6)
            {
                Console.WriteLine("reader number:" + wmDevice.ReaderNumber); //reader number
                Console.WriteLine("imei:" + wmDevice.Imei);                  //imei 


                if (dataList != null && dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {

                        if (dataList[i].GetType() == typeof(WMFileRecord))
                        {
                            WMFileRecord record=(WMFileRecord)dataList[i];
                            if (record.FileName.Length > 0)
                                Console.Write(record.FileName);
                        }
                        else
                        {

                            WM5000P6Record record = (WM5000P6Record)dataList[i];

                            Console.WriteLine("datetype:" + record.Recordtype);
                            Console.WriteLine("gurad id:" + record.GuardID); //guard nomber 

                            Console.WriteLine("address id:" + record.AddressID); //address nomber
                            Console.WriteLine("readtime:" + record.ReadTime.ToString("yyyy-MM-dd HH:mm:ss")); //read time
                            Console.WriteLine("information:" + record.Information); //guard nomber 
                            Console.WriteLine("longitude:" + record.Longitude); //guard nomber 
                            Console.WriteLine("latitude:" + record.Latitude); //guard nomber 
                            Console.WriteLine("satellites:" + record.Satellites);
                            Console.WriteLine("speed:" + record.Speed);
                        }
                    }
                }

                // must send respone to reader
                session.SendResponse(wmDevice.ResponseBytes);
                //Console.WriteLine(String.Format("{0},{1}", wmDevice.ResponseBytes[0], wmDevice.ResponseBytes[1]));                
                Console.WriteLine("========================================================");
            }
            else
                if (wmDevice.Devicetype == DeviceType.TIMING)
                {
                    // must send time respone to reader
                    session.SendResponse(wmDevice.ResponseBytes);
                }

        }
        
    }
}
