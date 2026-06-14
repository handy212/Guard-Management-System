// dllTest.cpp : 定义控制台应用程序的入口点。
//

#include "stdafx.h"
#include <windows.h>
#include <string>
#ifdef _DEBUG
#pragma comment(lib, "..\\JCommLib\\Debug\\libJComm.lib")
#else
#pragma comment(lib, "..\\JCommLib\\Release\\libJComm.lib")
#endif
long __stdcall OpenDevice();
long __stdcall GetAgent(char **agent);
long __stdcall GetManufacturer(char **agent);
long __stdcall GetDeviceId();
long __stdcall GetRecords(char *filename,int a);

typedef void (__stdcall *onReadData)(long totalpackets,long currentpacket);

void  __stdcall SetReadDataCallback(onReadData readDataCallback);

long __stdcall CloseDevice();
long __stdcall ClearRecords();
long __stdcall Verify(int val);
long __stdcall SetDialParam(char* apn, char* userid, char* password, char* pin1, char* pin2);
long __stdcall SetDateTime(long year,long month,long day,long hour,long minute,long second);

long __stdcall SetIpAndPort(char* ip,int port);
long __stdcall SetDomain(char* domain,char* dns,int port);
long __stdcall GetServerParam(char** sparam);
long __stdcall SetDialParam(char* apn, char* userid, char* password, char* pin1, char* pin2);
long __stdcall GetDialParam(char** sparam);

long __stdcall SetSendModel(int manual,int shuttime);
long __stdcall GetSendModel(char** model);
long __stdcall StartScan();
long __stdcall StopScan();
long __stdcall ScanCard(char **tagid);

long __stdcall SetCrash(int hasCrash);
long __stdcall GetCrash();
long __stdcall DownloadImages(char* imageFolder);
long __stdcall DownloadDisplayText(char* displayText);

typedef void (__stdcall *onDownLoadFile)(char* filename);
void  __stdcall SetDownLoadFileCallback(onDownLoadFile downloadCallback);
void __stdcall OnReadData(long total,long current)
{
	printf("total=%ld,current=%ld\r\n",total,current);
} 
void __stdcall OnDownLoadFile(char* filename)
{
	printf("%s\r\n",filename);
} 

int _tmain(int argc, _TCHAR* argv[])
{
//	for(int i=0;i<20;i++){
	//	long tickcount=GetTickCount();
	//	printf("GetTickCount()=%ld\r\n",tickcount);
	printf("OpenDevice()=%04X\r\n",OpenDevice());



	//printf("GetAgent()=%ld\r\n",GetManufacturer(&agent));

	//printf("%s\r\n",agent);
	//agent=NULL;
	//printf("SetDialParam=%ld\r\n",SetDialParam("cmnet","","","",""));

	//for (int i=0;i<10;i++){
	SetReadDataCallback(OnReadData);
		long xx=GetRecords("c:\\aaaa.txt",1);
		printf("GetRecords()=%ld\r\n",xx);

	printf("CloseDevice()=%ld\r\n",CloseDevice());


	getchar();
	return 0;
}

