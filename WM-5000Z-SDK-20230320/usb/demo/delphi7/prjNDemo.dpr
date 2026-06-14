program prjNDemo;

uses
  Forms,
  main in 'main.pas' {frmMain},
  libJcommCore in 'libJcommCore.pas',
  libV4 in 'libV4.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TfrmMain, frmMain);
  Application.Run;
end.
