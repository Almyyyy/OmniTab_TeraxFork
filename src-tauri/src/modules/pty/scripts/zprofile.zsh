# omnitab-shell-integration (zprofile)
#
# See zshenv.zsh for the rationale on the trailing `:`.
{
  _omnitab_user_zdotdir="${OMNITAB_USER_ZDOTDIR:-$HOME}"
  [ -f "$_omnitab_user_zdotdir/.zprofile" ] && source "$_omnitab_user_zdotdir/.zprofile"
  unset _omnitab_user_zdotdir
}
:
