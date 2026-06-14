Attribute VB_Name = "Module1"
Option Explicit
'long OpenDevice()
'long CloseDevice()
'long GetDeviceId()
'long Verify(int val)
'long SetDateTime(long year,long month,long day,long hour,long minute,long second)
'long GetRecords(char* filename,int encry)
'long ClearRecords()
'long SetAgent(char *agent)
'long GetAgent(char **agent)
'void SetReadDataCallback(onReadData readDataCallback)
'long SetReadInterval(int readInterval)
'long GetReadInterval()
'long SetFlashlightTouchTime(int timeOut)
'long GetFlashlightTouchTime()
'long SetFlashlightTime(int timeOut)
'long GetFlashlightTime()
'long SetCrash(int enabled,int param1,int param2)
'long GetCrash(char** param)
'long SetSchedulers(char* scheduler);
'long  GetSchedulers(char** scheduler);
'long SetPedometer(int hasPedometer)
'long GetPedometer()

Public Declare Function OpenDevice Lib "libJComm.dll" () As Long
Public Declare Function CloseDevice Lib "libJComm.dll" () As Long
Public Declare Function GetDeviceId Lib "libJComm.dll" () As Long
Public Declare Function Verify Lib "libJComm.dll" (ByVal val As Integer) As Long
Public Declare Function SetDateTime Lib "libJComm.dll" (ByVal year As Integer, ByVal month As Integer, ByVal day As Integer, ByVal hour As Integer, ByVal minute As Integer, ByVal second As Integer) As Long
Public Declare Function GetRecords Lib "libJComm.dll" (ByVal filename As String, ByVal encry As Integer) As Long

Public Declare Sub SetReadDataCallback Lib "libJComm.dll" (ByVal lProcAddress As Long)

Public Declare Function ClearRecords Lib "libJComm.dll" () As Long
Public Declare Function SetAgent Lib "libJComm.dll" (ByVal val As String) As Long
Public Declare Function GetAgent Lib "libJComm.dll" (ByRef mAgent As Long) As Long
Public Declare Function SetReadInterval Lib "libJComm.dll" (ByVal readInterval As Integer) As Long
Public Declare Function GetReadInterval Lib "libJComm.dll" () As Long
Public Declare Function SetFlashlightTouchTime Lib "libJComm.dll" (ByVal timeOut As Integer) As Long
Public Declare Function GetFlashlightTouchTime Lib "libJComm.dll" () As Long
Public Declare Function SetFlashlightTime Lib "libJComm.dll" (ByVal timeOut As Integer) As Long
Public Declare Function GetFlashlightTime Lib "libJComm.dll" () As Long
'param2 2000~7000
Public Declare Function SetCrash Lib "libJComm.dll" (ByVal enabled As Integer, ByVal param1 As Integer, ByVal param2 As Integer) As Long
Public Declare Function GetCrash Lib "libJComm.dll" (ByRef param As Long) As Long
Public Declare Function SetSchedulers Lib "libJComm.dll" (ByVal scheduler As String) As Long
Public Declare Function GetSchedulers Lib "libJComm.dll" (ByRef scheduler As Long) As Long
Public Declare Function SetPedometer Lib "libJComm.dll" (ByVal hasPedometer As Integer) As Long
Public Declare Function GetPedometer Lib "libJComm.dll" () As Long

Declare Function SendMessage Lib "user32" Alias "SendMessageA" (ByVal hwnd As Long, ByVal wMsg As Long, ByVal wParam As Long, lParam As Any) As Long

Public Declare Sub CopyMemory Lib "kernel32" _
Alias "RtlMoveMemory" (Destination As Any, Source As Any, _
    ByVal Length As Long)
    
Public Declare Function lstrlenA Lib "kernel32" _
   (ByVal lpString As Long) As Long

Public Declare Function lstrlenW Lib _
  "kernel32" (ByVal lpString As Long) As Long

Public Function PointerToString(lngPtr As Long) As String
'--------------------------------------------------------
'RETURNS A STRING FROM IT'S POINTER
'EXAMPLE:
'-- Generate pointer for demo purposes

'Dim l As Long
'Dim s As String
's = "THIS IS A TEST"
'l = StrPtr(s)

'--We have the pointer, call the function

'MsgBox PointerToString(l)

'NOTE: THE ASSUMPTION IS THAT THE POINTER IS TO A UNICODE STRING
'IF NOT, CHANGE THE FUNCTION AS FOLLOWS (UNTESTED)
'-- Change lstrlenW to lStrLena
'-- Get rid of the * 2
'-- The replace statement should not be necessary, just return strTemp
'----------------------------------------------------------
   
   Dim strTemp As String
   Dim lngLen As Long

   
   If lngPtr Then
      lngLen = lstrlenW(lngPtr) * 2
      If lngLen Then
         strTemp = Space(lngLen)
         CopyMemory ByVal strTemp, ByVal lngPtr, lngLen
         PointerToString = Replace(strTemp, Chr(0), "")
      End If
   End If
End Function

Public Sub OnReadData(ByVal totalpacket As Long, ByVal currentpacket As Long)
    'MsgBox CStr(totalpacket)
End Sub
