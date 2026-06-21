// Profile avatar: a real image if one is set, otherwise the name's initial on
// the profile's colour. An optional `ring` draws a coloured outline (used to
// show a player's chosen seat colour).
export function Avatar(props) {
  var profile = props.profile;
  var size = props.size || 72;
  var ring = props.ring;

  var style = {
    width: size + 'px',
    height: size + 'px',
    borderRadius: '50%',
    background: (profile && profile.avatarColor) || '#444',
    fontSize: Math.round(size * 0.42) + 'px'
  };
  if (ring) style.boxShadow = '0 0 0 4px ' + ring;

  var initial = profile && profile.name ? profile.name.charAt(0).toUpperCase() : '?';

  return (
    <div class="avatar" style={style}>
      {profile && profile.avatar
        ? <img src={profile.avatar} alt="" />
        : initial}
    </div>
  );
}
