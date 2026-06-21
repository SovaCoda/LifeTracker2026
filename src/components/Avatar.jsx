// Profile avatar: a real photo if one is set, otherwise the first two letters
// of the name on a single neutral colour (so avatar colours don't compete with
// the seat-colour picker). An optional `ring` draws the chosen seat colour.
var AVATAR_BG = '#394150';

export function Avatar(props) {
  var profile = props.profile;
  var size = props.size || 72;
  var ring = props.ring;

  var hasPhoto = profile && profile.avatar;
  var label = profile && profile.name ? profile.name.slice(0, 2).toUpperCase() : '?';

  var style = {
    width: size + 'px',
    height: size + 'px',
    borderRadius: '50%',
    background: hasPhoto ? 'transparent' : AVATAR_BG,
    fontSize: Math.round(size * 0.36) + 'px'
  };
  if (ring) style.boxShadow = '0 0 0 4px ' + ring;

  return (
    <div class="avatar" style={style}>
      {hasPhoto ? <img src={profile.avatar} alt="" /> : label}
    </div>
  );
}
