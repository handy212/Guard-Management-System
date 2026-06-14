unit libV4;

interface
            //SetCompass(int flag,int touchtime,int displaytime,int offsetx,int offsety)
    function SetReadInterval(readInterval:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetReadInterval():Integer;stdcall; far external 'libJComm.dll';
    function SetFlashlightTouchTime(timeOut:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetFlashlightTouchTime():Integer;stdcall; far external 'libJComm.dll';
    function SetLEDTouchTime(touchTime:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetLEDTouchTime():Integer;stdcall; far external 'libJComm.dll';
    function SetFlashlightTime(timeOut:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetFlashlightTime():Integer;stdcall; far external 'libJComm.dll';
    function SetCompass(flag,touchtime,displaytime,offsetx,offsety:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetCompass(var value:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';
    function SetCrash(enabled:Integer;param1:Integer;param2:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetCrash(var params:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';
    function SetLedDisplayInterval(interval:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetLedDisplayInterval():Integer;stdcall; far external 'libJComm.dll';
    function SetTemperatureDisplayMode(mode:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetTemperatureDisplayMode():Integer;stdcall; far external 'libJComm.dll';
    function SetConstant1(constant:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetConstant1():Integer;stdcall; far external 'libJComm.dll';
    function SetConstant2(constant:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetConstant2():Integer;stdcall; far external 'libJComm.dll';
    function SetRSSI(rssi:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetRSSI():Integer;stdcall; far external 'libJComm.dll';
    function GetVersion(var version:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';

    function Set2_4G(has24G:Integer):Integer;stdcall; far external 'libJComm.dll';
    function Get2_4G():Integer;stdcall; far external 'libJComm.dll';
    function SetScanTime(timeout:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetScanTime():Integer;stdcall; far external 'libJComm.dll';
    function DownloadImages(imageFolder:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';
    function DownloadDisplayText(displayText:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';
    function ScanCard(var tagid:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';
    function StartScan():Integer;stdcall; far external 'libJComm.dll';
    function StopScan():Integer;stdcall; far external 'libJComm.dll';
    function SetSchedulers(scheduler:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';
    function GetSchedulers(var scheduler:PAnsiChar):Integer;stdcall; far external 'libJComm.dll';

    function SetPedometer(has:Integer):Integer;stdcall; far external 'libJComm.dll';
    function GetPedometer():Integer;stdcall; far external 'libJComm.dll';    
implementation

end.
