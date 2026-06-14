using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Jwm.Device.Lib2;
using SuperSocket.SocketBase.Command;
using SuperSocket.SocketBase.Protocol;

using System.Data;
using System.IO;
using System.Net;
using System.Net.Sockets;


namespace SuperSocket.QuickStart.GPSSocketServer.Command
{
    public class JwmDevice : CommandBase<GPSSession, BinaryRequestInfo>
    {
      //  DataHelp db = new DataHelp();

        public override string Name
        {
            get
            {
                return "JWMDEVICE";
            }
        }
        private void writeToFile(Jwm.Device.Lib2.WmDevice wmDevice)
        {
            //保存数据到脚本
            String hexString = wmDevice.ToString();
            try
            {
                string path = wmDevice.ReaderNumber;
                if (!File.Exists(path)) {
                    File.WriteAllText(path, hexString);
                }
                StreamWriter sw = new StreamWriter(path, true);
                sw.WriteLine(hexString);
                sw.Close();
            }
            catch(Exception ex) {
                Console.WriteLine(ex.ToString());
            }
        }
        public override void ExecuteCommand(GPSSession session, BinaryRequestInfo requestInfo)
        {
            byte[] data = requestInfo.Body;
            if (data != null)
            {
                StringBuilder sb = new StringBuilder();
                foreach (byte b in data)
                {
                    sb.Append(String.Format("{0:X2} ", b));
                }
                Console.WriteLine(sb.ToString());
            }
            else
            {
                Console.WriteLine("data is null");
            }
            Console.WriteLine("***:" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));

            //判断是否是更新参数命令
            /*
            if (SyncParam.isSync(data,data.Length)){
                SyncParam sync = new SyncParam("127.0.0.1", 3306, "charge", "root", "494211a");
                byte[] buf = sync.parse(data, data.Length);
                if (sync.sucessCmd > 0 && sync.sucessCmdExt >= 0) { 
                    //命令设置成功
                    Console.WriteLine(String.Format("{0:X2}-{1:X4} 设置成功",sync.sucessCmd,sync.sucessCmdExt));
                }
                if (buf != null && buf.Length > 0) {
                    session.Send(buf, 0, buf.Length);
                }
                return;
            }
            */
            Jwm.Device.Lib2.WmDevice wmDevice = new Jwm.Device.Lib2.WmDevice();
            List<object> dataList = wmDevice.parseData(data, data.Length);
            Console.WriteLine("datatype:" + wmDevice.Devicetype);
            if (wmDevice.Devicetype == DeviceType.WM5000LG || wmDevice.Devicetype == DeviceType.WM5000L5)
            {
                Console.WriteLine(wmDevice.ReaderNumber);
                writeToFile(wmDevice);
                if (dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {
                        //typeof(WM5000LGRecord).IsInstanceOfType(i)
                        Record l5 = (Record)dataList[i];
                        Console.WriteLine(l5.AddressID);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Information);
                    }
                }
                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
            }
            else if (wmDevice.Devicetype == DeviceType.WM5000LT)
            {
                Console.WriteLine(wmDevice.ReaderNumber);
                writeToFile(wmDevice);
                if (dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {
                        //typeof(WM5000LGRecord).IsInstanceOfType(i)
                        Record l5 = (Record)dataList[i];
                        Console.WriteLine(l5.AddressID);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Information);
                    }
                }
                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
            }
            else if (wmDevice.Devicetype == DeviceType.WM5000P5)
            {
                Console.WriteLine(wmDevice.ReaderNumber);
                writeToFile(wmDevice);
                if (dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {
                        //typeof(WM5000LGRecord).IsInstanceOfType(i)
                        WM5000P5Record l5 = (WM5000P5Record)dataList[i];
                        Console.WriteLine(l5.AddressID);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Longitude);
                        Console.WriteLine(l5.Latitude);
                        Console.WriteLine(l5.Recordtype);
                        Console.WriteLine(l5.Satellites);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Information);
                    }
                }
                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
            } else if(wmDevice.Devicetype == DeviceType.WMZ){
                Console.WriteLine(wmDevice.ReaderNumber);
    
                if (dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {
                        WMZRecord l5 = (WMZRecord)dataList[i];
                        Console.WriteLine(l5.GuardID);
                        Console.WriteLine(l5.Recordtype);
                        Console.WriteLine(l5.AddressID);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Information);
                    }
                }
            }
            else if (wmDevice.Devicetype == DeviceType.WML4)
            {
                Console.WriteLine(wmDevice.ReaderNumber);
                writeToFile(wmDevice);
                if (dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {
                        WML4Record l5 = (WML4Record)dataList[i];
                        Console.WriteLine(l5.Recordtype);
                        Console.WriteLine(l5.AddressID);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Information);
                    }
                }
                // http://qy.kongdaokeji.com/jinwanma/receive

                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
            }
            else if (wmDevice.Devicetype == DeviceType.WMP4)
            {
                Console.WriteLine(wmDevice.ReaderNumber);
                writeToFile(wmDevice);
                if (dataList.Count > 0)
                {
                    for (int i = 0; i < dataList.Count; i++)
                    {
                        WML4Record l5 = (WML4Record)dataList[i];
                        Console.WriteLine(l5.AddressID);
                        Console.WriteLine(l5.ReadTime);
                        Console.WriteLine(l5.Information);
                    }
                }
                // http://qy.kongdaokeji.com/jinwanma/receive

                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
            }
            else if (wmDevice.Devicetype == DeviceType.HEARTBEAT) {
                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
            }
            else if (wmDevice.Devicetype == DeviceType.WMBASE)
            {
                StringBuilder sb3 = new StringBuilder();
                foreach (byte b2 in wmDevice.ResponseBytes)
                {
                    sb3.Append(String.Format("{0:X2} ", b2));
                }
                if (dataList != null && dataList.Count > 0)
                {
                    if (dataList[0].GetType() == typeof(WMFileRecord))
                    {
                        WMFileRecord record = (WMFileRecord)dataList[0];
                        string recordFilename = record.FileName;
                        Console.WriteLine("filepath:" + recordFilename);
                        if (recordFilename.Length > 0)
                        {
                            string h2filePath = System.AppDomain.CurrentDomain.BaseDirectory + "h2file";
                            string h2fileName = recordFilename.Substring(recordFilename.LastIndexOf("\\") + 1);
                            string fileFullpath = h2filePath + "\\" + h2fileName;
                            try
                            {
                                if (!File.Exists(fileFullpath))
                                {
                                    File.Move(recordFilename, fileFullpath);

                                    FileStream fs = new FileStream(fileFullpath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite);
                                    StreamReader sr = new StreamReader(fs, System.Text.Encoding.UTF8);
                                    String line;
                                    while ((line = sr.ReadLine()) != null)
                                    {
                                        string str = line.ToString();
                                        if (str != "")
                                        {
                                            String[] d = str.Split('\t');
                                            string readerCode = d[13];
                                            if (d[2].Length > 10)
                                            {
                                                //MF1 NFC ES
                                                d[2] = d[2].Substring(d[2].Length - 10);
                                            }
                                            if (d[3].Length > 10)
                                            {
                                                //MF1 NFC ES
                                                d[3] = d[3].Substring(d[3].Length - 10);
                                            }
                                            string rTime = "20" + d[9].Substring(0, 2) + "-" + d[9].Substring(2, 2) + "-" + d[9].Substring(4, 2) + " " + d[9].Substring(6, 2) + ":" + d[9].Substring(8, 2) + ":" + d[9].Substring(10);
                                            if (d[0] == "12")
                                            {
                                                //考勤卡
                                                /*
                                                DataTable dt = db.GetDataTable("SELECT g.GUARDID, g.GUARDNAME, g.DEPTID, d.DEPTNAME FROM guards g LEFT JOIN depts d ON g.DEPTID = d.DEPTID WHERE g.GUARDCODE = '" + d[3] + "'");
                                                if (dt.Rows.Count > 0)
                                                {
                                                    int guardid = int.Parse(dt.Rows[0][0].ToString());
                                                    string guardname = dt.Rows[0][1].ToString();
                                                    int deptid = int.Parse(dt.Rows[0][2].ToString());
                                                    string deptname = dt.Rows[0][3].ToString();
                                                    string insertStr = "insert into userduty (DEPTID,DEPTNAME,GUARDID,GUARDCODE,GUARDNAME,READERCODE,HAPPENTIME) VALUES(" + deptid + ",'" + deptname + "'," + guardid + ",'" + d[3] + "','" + guardname
                                                                                 + "','" + readerCode + "','" + rTime + "');";
                                                    int result = db.ExecuteCommand(insertStr);

                                                }*/
                                            }
                                            else
                                            {
                                                string commandText = "insert into readerdatas (DATATYPE,PLANID,GUARDCODE,EMCODE,HAPPENTIME,READERCODE,LONGITUDE,LATITUDE,PEDOMETER,INSTANTDATA,DATACONTENT,IMEI) VALUES(" + d[0] + "," + d[1] + ",'" + d[2] + "','" + d[3]
                                                                                 + "','" + rTime + "','" + readerCode + "','" + d[4] + "','" + d[5] + "','" + d[11] + "',0,'" + d[12] + "','');";
                                                Console.WriteLine("commandText：" + commandText);
                                                //int result = db.ExecuteCommand(commandText);

                                            }
                                        }
                                    }
                                    sr.Close();
                                    fs.Close();
                                }
                                Console.WriteLine("reply");
                                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
                                new FileInfo(fileFullpath).Attributes = FileAttributes.Normal;
                                File.Delete(fileFullpath);
                            }
                            catch (Exception ex)
                            {
                                string errText = "INSERT INTO errmessage (ERRMESSAE, METHODNAME, HAPPENTIME) VALUES('" + ex.Message + "','DataRecv：+" + h2fileName + "','" + DateTime.Now + "');";
                                // db.ExecuteCommand(errText);
                                // Console.WriteLine(ex.Message);
                            }
                        }
                    }
                }
                session.Send(wmDevice.ResponseBytes, 0, wmDevice.ResponseBytes.Length);
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < wmDevice.ResponseBytes.Length; i++)
                    sb.Append(String.Format("{0:X2} ", wmDevice.ResponseBytes[i]));
                Console.WriteLine(sb.ToString());
            }
            else
            {
                if (wmDevice.Devicetype == DeviceType.TIMING)
                {
                    // must send time respone to reader
                    DateTime localTime = DateTime.Now;
                    byte[] d = wmDevice.getResponeTime(localTime);
                    session.Send(d, 0, d.Length);

                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < wmDevice.ResponseBytes.Length; i++)
                        sb.Append(String.Format("{0:X2} ", wmDevice.ResponseBytes[i]));
                    Console.WriteLine(sb.ToString());
                }
            }
        }
    }
}
