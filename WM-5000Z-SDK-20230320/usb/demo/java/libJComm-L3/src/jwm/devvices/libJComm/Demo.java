package jwm.devvices.libJComm;

import java.util.Calendar;

import com.sun.jna.Callback;
import com.sun.jna.Library;
import com.sun.jna.Native;
//import com.sun.jna.Platform;

public class Demo {

	 public interface LibJComm extends Library{
		 LibJComm instance=(LibJComm)Native.loadLibrary("G:\\devsoft\\WMClass\\NewCommon\\sdk\\sdk\\x64\\Release\\libJComm",LibJComm.class);
		 
		 interface onReadData extends Callback{
			 void OnReadData(int totalpackets,int currentpacket);
	     }
		 public void SetReadDataCallback(onReadData readDataCallback);
		 //
		 public int OpenDeviceByType(int devicetype);
		 public int GetReaderNo();
		 public int CloseDevice();
		 public int GetRecords(String filename,int en);
		 public int Verify(int val);
		 public int ClearRecords();
		 
		 public int SetDateTime(int year,int month,int day,int hour,int minute,int second);
		 
		 public int GetAgent(String[] agent);
		 public int SetAgent(String agent);
	 }
	public static void main(String[] args) {
		LibJComm libJComm=LibJComm.instance;
		System.out.println("OpenDevice="+libJComm.OpenDeviceByType(0x1001));
		LibJComm.onReadData readDataCallback= new LibJComm.onReadData(){
			@Override
			public void OnReadData(int totalpackets, int currentpacket) {
				System.out.println("totalpackets="+totalpackets+",currentpacket="+currentpacket);
			}
		};
		libJComm.SetReadDataCallback(readDataCallback);
		libJComm.Verify(0);
		System.out.println("Device id="+libJComm.GetReaderNo());
		Calendar cal=Calendar.getInstance();
		
		System.out.println("SetDateTime="+libJComm.SetDateTime(cal.get(Calendar.YEAR),cal.get(Calendar.MONTH)+1,cal.get(Calendar.DATE),
				cal.get(Calendar.HOUR_OF_DAY),cal.get(Calendar.MINUTE),cal.get(Calendar.SECOND)));
		
		System.out.println("GetRecords="+libJComm.GetRecords("j:\\v8logs.txt",0));
		
		/*
		System.out.println("SetAgent="+libJComm.SetAgent("沈阳金万码高科技发展有限公司"));
		String[] agent=new String[1];
		System.out.println("GetAgent="+libJComm.GetAgent(agent));
		System.out.println("agent="+agent[0]);
		*/
		System.out.println("CloseDevice="+libJComm.CloseDevice());
		
	}
		

}
