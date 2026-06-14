object frmMain: TfrmMain
  Left = 195
  Top = 112
  Width = 1056
  Height = 667
  Caption = 'v4-demo'
  Color = clBtnFace
  Font.Charset = ANSI_CHARSET
  Font.Color = clWindowText
  Font.Height = -13
  Font.Name = #23435#20307
  Font.Style = []
  OldCreateOrder = False
  Position = poScreenCenter
  Scaled = False
  PixelsPerInch = 96
  TextHeight = 13
  object Panel1: TPanel
    Left = 0
    Top = 0
    Width = 1048
    Height = 41
    Align = alTop
    TabOrder = 0
    DesignSize = (
      1048
      41)
    object label_status: TLabel
      Left = 16
      Top = 12
      Width = 8
      Height = 13
      Font.Charset = ANSI_CHARSET
      Font.Color = clRed
      Font.Height = -13
      Font.Name = #23435#20307
      Font.Style = [fsBold]
      ParentFont = False
    end
    object Button1: TButton
      Left = 424
      Top = 8
      Width = 152
      Height = 25
      Anchors = [akLeft, akTop, akRight]
      Caption = 'connect device'
      Font.Charset = ANSI_CHARSET
      Font.Color = clWindowText
      Font.Height = -13
      Font.Name = #23435#20307
      Font.Style = [fsBold]
      ParentFont = False
      TabOrder = 0
      OnClick = Button1Click
    end
  end
  object Panel2: TPanel
    Left = 0
    Top = 592
    Width = 1048
    Height = 41
    Align = alBottom
    TabOrder = 1
    DesignSize = (
      1048
      41)
    object Button2: TButton
      Left = 440
      Top = 8
      Width = 152
      Height = 25
      Anchors = [akLeft, akTop, akRight, akBottom]
      Caption = 'disconnect device'
      Font.Charset = ANSI_CHARSET
      Font.Color = clWindowText
      Font.Height = -13
      Font.Name = #23435#20307
      Font.Style = [fsBold]
      ParentFont = False
      TabOrder = 0
      OnClick = Button2Click
    end
  end
  object PageControl1: TPageControl
    Left = 0
    Top = 41
    Width = 1048
    Height = 551
    ActivePage = TabSheet1
    Align = alClient
    TabOrder = 2
    object TabSheet1: TTabSheet
      Caption = 'base'
      object Button3: TButton
        Left = 16
        Top = 18
        Width = 145
        Height = 25
        Caption = 'get device id'
        TabOrder = 0
        OnClick = Button3Click
      end
      object Button5: TButton
        Left = 171
        Top = 18
        Width = 141
        Height = 25
        Caption = 'set date time'
        TabOrder = 1
        OnClick = Button5Click
      end
      object Button6: TButton
        Left = 19
        Top = 50
        Width = 140
        Height = 25
        Caption = 'get record'
        TabOrder = 2
        OnClick = Button6Click
      end
      object Button7: TButton
        Left = 172
        Top = 50
        Width = 133
        Height = 25
        Caption = 'clear record'
        TabOrder = 3
        OnClick = Button7Click
      end
      object edt_Agent: TEdit
        Left = 24
        Top = 84
        Width = 425
        Height = 21
        MaxLength = 50
        TabOrder = 4
      end
      object edt_Serviceing: TEdit
        Left = 24
        Top = 110
        Width = 425
        Height = 21
        MaxLength = 50
        TabOrder = 5
      end
      object Button9: TButton
        Left = 453
        Top = 84
        Width = 121
        Height = 25
        Caption = 'set agent'
        TabOrder = 6
        OnClick = Button9Click
      end
      object Button10: TButton
        Left = 454
        Top = 111
        Width = 120
        Height = 25
        Caption = 'get agent'
        TabOrder = 7
      end
      object ProgressBar1: TProgressBar
        Left = 312
        Top = 53
        Width = 281
        Height = 17
        TabOrder = 8
      end
      object Memo1: TMemo
        Left = 0
        Top = 144
        Width = 1040
        Height = 379
        Align = alBottom
        Anchors = [akLeft, akTop, akRight, akBottom]
        Lines.Strings = (
          'Memo1')
        ScrollBars = ssBoth
        TabOrder = 9
      end
    end
  end
  object OpenDialog1: TOpenDialog
    Left = 328
    Top = 184
  end
end
