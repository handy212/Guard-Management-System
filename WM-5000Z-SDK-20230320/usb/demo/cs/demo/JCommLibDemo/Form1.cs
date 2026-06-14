using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace JCommLibDemo
{
    //delegate void onReadData(Int32 totalpackets, Int32 currentpacket);
    public partial class Form1 : Form
    {
       // static string DLL = @"G:\devsoft\WMClass\NewCommon\JCommLib\JCommLib\x64\Debug\libJComm.dll";

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool SetDllDirectory(string path);

        public static onReadData OnReadData;//静态全局变量


        [DllImport("libJComm.dll")]
        public extern static Int32 OpenDevice();
        [DllImport("libJComm.dll")]
        public extern static Int32 OpenDeviceByType(Int32 devType);
        
        [DllImport("libJComm.dll")]
        public extern static Int32 CloseDevice();
        

        [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
        public static extern Int32 GetRecords(string filename,Int32 encry);
        [DllImport("libJComm.dll")]
        public static extern Int32 ClearRecords();
        [DllImport("libJComm.dll", CharSet = CharSet.Ansi)]
        public static extern Int32 SetAgent(string agent);


        [DllImport("libJComm.dll")]        
        public static extern Int32 GetAgent(ref IntPtr agent);

        [DllImport("libJComm.dll")]
        public  static extern Int32 GetDeviceId();

        [DllImport("libJComm.dll")]
        public static extern Int32 Verify(Int32 val);

        [UnmanagedFunctionPointer(CallingConvention.StdCall)]
        public delegate void onReadData(Int32 totalpackets, Int32 currentpacket);

        [DllImport("libJComm.dll", EntryPoint = "SetReadDataCallback", CharSet = CharSet.Ansi)]
        public static extern int SetReadDataCallback([MarshalAs(UnmanagedType.FunctionPtr)] onReadData readDataCallback);


        [DllImport("libJComm.dll")]
        public static extern Int32 SetIpAndPort(string ip, int port);
        [DllImport("libJComm.dll")]
        public static extern Int32 SetDomain(string domain, string dns, int port);
        [DllImport("libJComm.dll")]
        public static extern Int32 GetServerParam(ref IntPtr param);
        [DllImport("libJComm.dll")]
        public static extern Int32 SetDialParam(string apn, string userid, string password, string pin1, string pin2);
        [DllImport("libJComm.dll")]
        public static extern Int32 GetDialParam(ref IntPtr param);
        [DllImport("libJComm.dll")]
        public static extern Int32 GetImei(ref IntPtr imei);
        [DllImport("libJComm.dll")]
        public static extern Int32 GetDateTime(ref IntPtr dt);

        public static void OnReadDataing(Int32 totalpackets, Int32 currentpacket) {
            Console.WriteLine("totalpackets=" + totalpackets + ";currentpacket=" + currentpacket);
        }

        bool deviceOpened = false;
        public Form1()
        {
            InitializeComponent();
            String path = Path.GetDirectoryName(Assembly.GetEntryAssembly().Location);
            path = Path.Combine(path, Environment.Is64BitProcess ? "libs\\x64" : "libs\\x86");
            SetDllDirectory(path);
        }

        private void button1_Click(object sender, EventArgs e)
        {
           deviceOpened = OpenDevice() > 0;
           
        }

        private void button5_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
                CloseDevice();
            deviceOpened = false;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
                MessageBox.Show(GetDeviceId()+"");
        }

        private void button3_Click(object sender, EventArgs e)
        {
            if (deviceOpened){
                OnReadData = OnReadDataing;
                SetReadDataCallback(OnReadData);
                Verify(1);
                MessageBox.Show(GetRecords("records.txt",0) + "");
            }
        }

        private void button6_Click(object sender, EventArgs e)
        {
             if (deviceOpened)
                MessageBox.Show(SetAgent("agent") + "");
        }

        private void button4_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {
               
                try
                {
                    IntPtr p = IntPtr.Zero;
                    int result= GetAgent(ref p);
                    if (result >= 0)
                    {
                        string v = Marshal.PtrToStringAnsi(p);
                        MessageBox.Show(v);
                    }
                    else
                        MessageBox.Show(result+"");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.ToString());
                }
            }
 
        }


        private void Form1_Load(object sender, EventArgs e)
        {
            
        }

        private void button7_Click_1(object sender, EventArgs e)
        {
            if (deviceOpened)
            {
                Verify(1);
                MessageBox.Show(ClearRecords() + "");
            }
        }

        private void button8_Click(object sender, EventArgs e)
        {
            
        }

        private void button9_Click(object sender, EventArgs e)
        {
            
        }

        private void button10_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {

                MessageBox.Show(SetIpAndPort(textBoxIp.Text, (int)numericPort.Value) + "");
            }
        }

        private void button11_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {
                MessageBox.Show(SetDomain(textDomain.Text,textDns.Text, (int)numericPort.Value) + "");
            }
        }

        private void button12_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {

                try
                {
                    IntPtr p = IntPtr.Zero;
                    int result = GetServerParam(ref p);
                    if (result >= 0)
                    {
                        string v = Marshal.PtrToStringAnsi(p);
                        MessageBox.Show(v);
                    }
                    else
                        MessageBox.Show(result + "");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.ToString());
                }
            }
        }

        private void button13_Click(object sender, EventArgs e)
        {
            //SetDialParam(string apn, string userid, string password, string pin1, string pin2);
            if (deviceOpened)
            {
                MessageBox.Show(SetDialParam(textApn.Text, textUserId.Text,textPassword.Text,textPin1.Text,textPin2.Text) + "");
            }
        }

        private void button14_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {

                try
                {
                    IntPtr p = IntPtr.Zero;
                    int result = GetDialParam(ref p);
                    if (result >= 0)
                    {
                        string v = Marshal.PtrToStringAnsi(p);
                        MessageBox.Show(v);
                    }
                    else
                        MessageBox.Show(result + "");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.ToString());
                }
            }
        }

        private void button16_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {
                Verify(1);
                try
                {
                    IntPtr p = IntPtr.Zero;
                    int result = GetDateTime(ref p);
                    if (result >= 0)
                    {
                        string v = Marshal.PtrToStringAnsi(p);
                        MessageBox.Show(v);
                    }
                    else
                        MessageBox.Show(result + "");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.ToString());
                }
            }
        }

        private void button15_Click(object sender, EventArgs e)
        {
            if (deviceOpened)
            {

                try
                {
                    IntPtr p = IntPtr.Zero;
                    int result = GetImei(ref p);
                    if (result >= 0)
                    {
                        string v = Marshal.PtrToStringAnsi(p);
                        MessageBox.Show(v);
                    }
                    else
                        MessageBox.Show(result + "");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.ToString());
                }
            }
        }
    }
}
