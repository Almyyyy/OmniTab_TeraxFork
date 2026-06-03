; "Open in OmniTab" shell verbs for folders, folder backgrounds, and drives.
; HKCU matches installer currentUser scope. %V = clicked path.
; NoWorkingDirectory keeps Explorer from overriding %V (System32 on Drive).

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInOmniTab" "" "Open in OmniTab"
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInOmniTab" "Icon" '"$INSTDIR\omnitab.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInOmniTab" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInOmniTab\command" "" '"$INSTDIR\omnitab.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInOmniTab" "" "Open in OmniTab"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInOmniTab" "Icon" '"$INSTDIR\omnitab.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInOmniTab" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInOmniTab\command" "" '"$INSTDIR\omnitab.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInOmniTab" "" "Open in OmniTab"
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInOmniTab" "Icon" '"$INSTDIR\omnitab.exe",0'
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInOmniTab" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInOmniTab\command" "" '"$INSTDIR\omnitab.exe" "%V"'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Directory\shell\OpenInOmniTab"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\OpenInOmniTab"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\OpenInOmniTab"
!macroend
