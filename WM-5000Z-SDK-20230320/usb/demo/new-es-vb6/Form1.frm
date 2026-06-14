VERSION 5.00
Begin VB.Form Form1 
   Caption         =   "Form1"
   ClientHeight    =   6030
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8610
   LinkTopic       =   "Form1"
   ScaleHeight     =   6030
   ScaleWidth      =   8610
   StartUpPosition =   2  'CenterScreen
   Begin VB.CommandButton Command20 
      Caption         =   "Get Pedometer"
      Height          =   615
      Left            =   2400
      TabIndex        =   19
      Top             =   4200
      Width           =   2055
   End
   Begin VB.CommandButton Command19 
      Caption         =   "Set Pedometer"
      Height          =   615
      Left            =   120
      TabIndex        =   18
      Top             =   4200
      Width           =   2295
   End
   Begin VB.CommandButton Command18 
      Caption         =   "Get Scheduler"
      Height          =   615
      Left            =   6480
      TabIndex        =   17
      Top             =   3480
      Width           =   1815
   End
   Begin VB.CommandButton Command17 
      Caption         =   "Set Scheduler"
      Height          =   615
      Left            =   4440
      TabIndex        =   16
      Top             =   3480
      Width           =   2055
   End
   Begin VB.CommandButton Command16 
      Caption         =   "Get Crash"
      Height          =   615
      Left            =   2400
      TabIndex        =   15
      Top             =   3480
      Width           =   2055
   End
   Begin VB.CommandButton Command15 
      Caption         =   "Set Crash"
      Height          =   615
      Left            =   120
      TabIndex        =   14
      Top             =   3480
      Width           =   2295
   End
   Begin VB.CommandButton Command14 
      Caption         =   "Get Flash light Time"
      Height          =   615
      Left            =   6480
      TabIndex        =   13
      Top             =   2760
      Width           =   1815
   End
   Begin VB.CommandButton Command13 
      Caption         =   "Set Flash light Time"
      Height          =   615
      Left            =   4440
      TabIndex        =   12
      Top             =   2760
      Width           =   2055
   End
   Begin VB.CommandButton Command12 
      Caption         =   "Get Flashlight TouchTime"
      Height          =   615
      Left            =   2400
      TabIndex        =   11
      Top             =   2760
      Width           =   2055
   End
   Begin VB.CommandButton Command11 
      Caption         =   "Set Flashlight TouchTime"
      Height          =   615
      Left            =   120
      TabIndex        =   10
      Top             =   2760
      Width           =   2295
   End
   Begin VB.CommandButton Command10 
      Caption         =   "Get Read Interval"
      Height          =   615
      Left            =   6480
      TabIndex        =   9
      Top             =   1920
      Width           =   1815
   End
   Begin VB.CommandButton Command9 
      Caption         =   "Set Read Interval"
      Height          =   615
      Left            =   4440
      TabIndex        =   8
      Top             =   1920
      Width           =   2055
   End
   Begin VB.CommandButton Command8 
      Caption         =   "Get Agent"
      Height          =   615
      Left            =   2400
      TabIndex        =   7
      Top             =   1920
      Width           =   2055
   End
   Begin VB.CommandButton Command7 
      Caption         =   "Set Agent"
      Height          =   615
      Left            =   120
      TabIndex        =   6
      Top             =   1920
      Width           =   2295
   End
   Begin VB.CommandButton Command6 
      Caption         =   "Clear Records"
      Height          =   615
      Left            =   6480
      TabIndex        =   5
      Top             =   1080
      Width           =   1815
   End
   Begin VB.CommandButton Command5 
      Caption         =   "Get Records"
      Height          =   615
      Left            =   4440
      TabIndex        =   4
      Top             =   1080
      Width           =   2055
   End
   Begin VB.CommandButton Command4 
      Caption         =   "Set Date Time"
      Height          =   615
      Left            =   2400
      TabIndex        =   3
      Top             =   1080
      Width           =   2055
   End
   Begin VB.CommandButton Command3 
      Caption         =   "GetDevice ID"
      Height          =   615
      Left            =   120
      TabIndex        =   2
      Top             =   1080
      Width           =   2295
   End
   Begin VB.CommandButton Command2 
      Caption         =   "CloseDevice"
      Height          =   735
      Left            =   2880
      TabIndex        =   1
      Top             =   5040
      Width           =   3015
   End
   Begin VB.CommandButton Command1 
      Caption         =   "OpenDevice"
      Height          =   735
      Left            =   2520
      TabIndex        =   0
      Top             =   240
      Width           =   2775
   End
End
Attribute VB_Name = "Form1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Dim opened As Integer
Private Sub Command1_Click()
    opened = OpenDevice
    If opened >= 0 Then
        MsgBox "Open device success"
    Else
        MsgBox "Open device failure"
    End If
End Sub

Private Sub Command10_Click()
    Dim result As Long
    result = GetReadInterval
    MsgBox CStr(result)
End Sub

Private Sub Command11_Click()
'Set Flashlight TouchTime
    Dim result As Long
    result = SetFlashlightTouchTime(3)
    MsgBox CStr(result)
End Sub

Private Sub Command12_Click()
    Dim result As Long
    result = GetFlashlightTouchTime
    MsgBox CStr(result)
End Sub

Private Sub Command13_Click()
'SetFlashlightTime
 Dim result As Long
 result = SetFlashlightTime(30)
 MsgBox CStr(result)
End Sub

Private Sub Command14_Click()
 Dim result As Long
 result = GetFlashlightTime
 MsgBox CStr(result)
End Sub

Private Sub Command15_Click()
'SetCrash
Dim result As Long
    'param2 2000~7000
    result = SetCrash(1, 0, 2048)
    MsgBox CStr(result)
End Sub

Private Sub Command16_Click()
    
 Dim result As Long
 Dim vValue As Long
 Dim rs As String
 
 result = GetCrash(vValue)
 If result >= 0 Then
  rs = PointerToString(vValue)
  MsgBox rs
 Else
    MsgBox CStr(result)
 End If
 
End Sub

Private Sub Command17_Click()
'SetSchedulers
 Dim result As Long
 Dim mSecheduler As String
 mSecheduler = "08:00" & Chr(13) & Chr(10) & "08:30" & Chr(13) & Chr(10) & "13:40" & Chr(13) & Chr(10) & "20:45" & Chr(13) & Chr(10)
 result = SetSchedulers(mSecheduler)
 MsgBox CStr(result)
End Sub

Private Sub Command18_Click()
 Dim result As Long
 Dim vValue As Long
 Dim rs As String
 
 result = GetSchedulers(vValue)
 If result >= 0 Then
  rs = PointerToString(vValue)
  MsgBox rs
 Else
    MsgBox CStr(result)
 End If
End Sub

Private Sub Command19_Click()
'SetPedometer
Dim result As Long
    result = SetPedometer(1)
    MsgBox CStr(result)
End Sub

Private Sub Command2_Click()
    CloseDevice
    opened = -1
End Sub

Private Sub Command20_Click()
Dim result As Long
    result = GetPedometer
    MsgBox CStr(result)
End Sub

Private Sub Command3_Click()
    Dim result As Long
    result = GetDeviceId
    MsgBox CStr(result)
End Sub

Private Sub Command4_Click()
Dim result As Long
    Verify (0)
    result = SetDateTime(year(Now), month(Now), day(Now), hour(Now), minute(Now), second(Now))
    MsgBox CStr(result)
End Sub

Private Sub Command5_Click()
    Dim result As Long
    Verify (0)
     ''''Call SetReadDataCallback(AddressOf OnReadData)
    result = GetRecords("es_logs.txt", 0)
    MsgBox CStr(result)
End Sub

Private Sub Command6_Click()
    Dim result As Long
    Verify (0)
    result = ClearRecords
    MsgBox CStr(result)
End Sub

Private Sub Command7_Click()
 Dim result As Long
 result = SetAgent("agent name")
 MsgBox CStr(result)
End Sub

Private Sub Command8_Click()
 Dim result As Long
 Dim mAgent As Long
 Dim rs As String
 
 result = GetAgent(mAgent)
 If result >= 0 Then
  rs = PointerToString(mAgent)
  MsgBox rs
 Else
    MsgBox CStr(result)
 End If
End Sub

Private Sub Command9_Click()
    Dim result As Long
    Verify (0)
    result = SetReadInterval(60)
    MsgBox CStr(result)
End Sub


