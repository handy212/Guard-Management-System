# WM5000LT Protocol Package

## Jwm.Device.Lib2.dll

This library encapsulates the protocols for three devices:

- WM5000LT
- WM5000P5
- WM5000L5

## Device Type

```csharp
public enum DeviceType
{
    UNKNOWN=0,
    WM5000L5,
    WM5000LT,
    WM5000LG,
    WM5000P5,
    WMZ,
    TIMING
}
```

- WM5000L5: 5000L5 Device
- WM5000LT: 5000LT Device
- WM5000LG: 5000LG Device (currently the LG protocol is the same as L5, therefore it is parsed as LT)
- WM5000P5: 5000P5 Device
- TIMING: Time verification notification data packet
- UNKNOWN: Unknown data type

## Record Type

```csharp
public enum RecordType
{
    Normal=0,
    GPSTrail,
    GPSCheckPoint,
    GPSPosition,
    ManuAlarm,
    LowVoltage,
    CustomButton
}
```

### Record Type Descriptions

- Normal: Normal Record (RFID Tag Data)
- GPSTrail: GPS Track Data
- GPSCheckPoint: GPS Checkpoint Data
- GPSPosition: GPS Position Data
- ManuAlarm: Manual Alarm Data
- LowVoltage: Low Power Data
- CustomButton: User-defined Button Data

## Record Structure

```csharp
public class Record
{
    public string GuardID;
    public string AddressID;
    public DateTime ReadTime;
    public RecordType Recordtype;
    public string Information;
}
```

```csharp
public class WM5000LTRecord : Record {}
public class WM5000L5Record : Record {}
public class WM5000LGRecord : Record {}

public class WM5000P5Record : Record
{
    public double Longitude;
    public double Latitude;
    public double Speed;
    public int Satellites;
}
```

### Fields

- GuardID: Guard Card Number
- AddressID: Checkpoint Card Number
- ReadTime: Card Reading Time
- Recordtype: Record Type
- Information: Record Content
- Longitude: Longitude
- Latitude: Latitude
- Speed: Speed
- Satellites: Number of Satellites

### Record Type Behavior

**Normal**  
Information may be empty or contain a comma-separated patrol event string such as:

`1,3,5`

**GPSCheckPoint**  
Information may be empty or contain a comma-separated patrol event string such as:

`1,3,5`

**ManuAlarm**  
Information:

`MANUALARM`

**LowVoltage**  
Information contains a voltage value such as:

`3.40`

**CustomButton**

- LBUTTON = Left Button
- RBUTTON = Right Button
- DBBUTTON = Dual Button

## WmDevice Protocol Class

```csharp
public class WmDevice
{
    public WmDevice();

    public List<object> parseData(byte[] sdata, int slength);

    public DeviceType Devicetype;
    public byte[] ResponseBytes;
    public string ReaderNumber;
    public string Agency;
    public string Imei;
}
```

## parseData

```csharp
List<object> parseData(byte[] data, int length);
```

### Parameters

- data: Received TCP data packet
- length: Length of the data packet

### Return Value

- WM5000LT → WM5000LT record collection
- WM5000LG → WM5000LG record collection
- WM5000L5 → WM5000L5 record collection
- WM5000P5 → WM5000P5 record collection
- TIMING → null
- UNKNOWN → null

### Properties

- ReaderNumber: Device Number
- Agency: Distributor Number
- Devicetype: Device model of the received TCP packet
- ResponseBytes: Data that must be returned to the handheld device

After calling parseData(), if:

```csharp
Devicetype != DeviceType.UNKNOWN
```

ResponseBytes must be sent back to the handheld device.

## Example

```csharp
WmDevice wmdevice = new Wm5000Device();

List<object> dataList =
    wmdevice.parseData(data, data.Length);
```

(Example code continues exactly as provided in the original document.)

## Demo GPRSSocketServer

The Demo GPRSSocketServer program uses SuperSocket as a TCP server and then calls Jwm.Device.Lib.dll to parse data packets.

SuperSocket source code:

http://supersocket.codeplex.com/

The call to Jwm.Device.Lib2.dll is located in:

`WmDevice.cs`

### Demo Program Usage

- RunServer.bat – Run TCP server in Console mode.
- InstallService.bat – Install Windows Service.
- UninstallService.bat – Uninstall Windows Service.

## Change Server Port

Modify:

`SuperSocket.SocketService.exe.config`

Change:

`8989`

to another port number.

## WindowsFormsApplication1

A program used to simulate data packets and WM5000 devices.

### Functions

- Simulate TCP – Simulates a WM5000 handheld device sending data.
- Parse Test – Simulates and tests packet parsing.
