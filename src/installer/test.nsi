# define the application name
!define AppName "Cybermuse-desktop"

# name the installer
OutFile "${AppName} installer.exe"

# define the installation directory
InstallDir $PROGRAMFILES\${AppName}

# default section start
Section

  # set the output path for installed files
  SetOutPath $INSTDIR

  # include necessary files and directories
  File /r ..\..\out\*
  File /r ..\..\llamacpp\*
  SetOutPath "$INSTDIR\migrations"
  File /r "..\migrations\"

  # create shortcuts
  CreateDirectory $SMPROGRAMS\${AppName}
  CreateShortCut "$SMPROGRAMS\${AppName}\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  CreateShortCut "$SMPROGRAMS\${AppName}\${AppName}.lnk" "$INSTDIR\cybermuse-desktop.exe"

  # include uninstaller
  WriteUninstaller $INSTDIR\uninstall.exe

# default section end
SectionEnd

# uninstall section start
Section "Uninstall"

  # remove files and directories
  RMDir /r $INSTDIR

  # remove shortcuts and directories
  Delete "$SMPROGRAMS\${AppName}\Uninstall.lnk"
  Delete "$SMPROGRAMS\${AppName}\${AppName}.lnk"
  RMDir $SMPROGRAMS\${AppName}

# uninstall section end
SectionEnd
