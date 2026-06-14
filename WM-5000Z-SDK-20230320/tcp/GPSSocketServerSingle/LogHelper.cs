using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;

namespace SuperSocket.QuickStart.GPSSocketServer
{
    class LogHelper
    {
        private LogHelper()
        {

        }
        public static void WriteLog(string Log)
        {
            string path = ConfigurationManager.AppSettings["imgPath"] + "\\datas";
            if (Directory.Exists(path) == false)//如果不存在就创建file文件夹
            {
                Directory.CreateDirectory(path);
            }
            // 判断文件是否存在，不存在则创建，否则读取值显示到txt文档
            if (!System.IO.File.Exists(path + "/" + DateTime.Today.ToString("yyyy-MM-dd") + ".txt"))
            {
                FileStream fs1 = new FileStream(path + "/" + DateTime.Today.ToString("yyyy-MM-dd") + ".txt", FileMode.Create, FileAccess.Write);//创建写入文件 
                StreamWriter sw = new StreamWriter(fs1);
                sw.WriteLine(Log);//开始写入值
                sw.Close();
                fs1.Close();
            }
            else
            {
                FileStream fs = new FileStream(path + "/" + DateTime.Today.ToString("yyyy-MM-dd") + ".txt" + "", FileMode.Append, FileAccess.Write);
                StreamWriter sr = new StreamWriter(fs);
                sr.WriteLine(Log);//开始写入值
                sr.Close();
                fs.Close();
            }
        }
    }
}
