import { View } from 'react-native';

export default function Icon({ name, color = '#D1D5DB', size = 22 }) {
  const stroke = Math.max(1.5, size * 0.075);
  const base = { position: 'absolute', backgroundColor: color, borderRadius: stroke };
  const frame = {
    position: 'absolute',
    borderColor: color,
    borderWidth: stroke,
    borderRadius: size * 0.12,
  };

  let shape;
  if (name === 'document') {
    shape = <>
      <View style={[frame, { left: size * 0.2, top: size * 0.08, width: size * 0.6, height: size * 0.82 }]} />
      <View style={[base, { left: size * 0.33, top: size * 0.38, width: size * 0.34, height: stroke }]} />
      <View style={[base, { left: size * 0.33, top: size * 0.54, width: size * 0.34, height: stroke }]} />
      <View style={[base, { left: size * 0.33, top: size * 0.7, width: size * 0.24, height: stroke }]} />
    </>;
  } else if (name === 'calendar') {
    shape = <>
      <View style={[frame, { left: size * 0.1, top: size * 0.17, width: size * 0.8, height: size * 0.72 }]} />
      <View style={[base, { left: size * 0.12, top: size * 0.39, width: size * 0.76, height: stroke }]} />
      <View style={[base, { left: size * 0.31, top: size * 0.06, width: stroke, height: size * 0.25 }]} />
      <View style={[base, { left: size * 0.65, top: size * 0.06, width: stroke, height: size * 0.25 }]} />
      <View style={[base, { left: size * 0.31, top: size * 0.54, width: stroke * 1.5, height: stroke * 1.5 }]} />
      <View style={[base, { left: size * 0.51, top: size * 0.54, width: stroke * 1.5, height: stroke * 1.5 }]} />
      <View style={[base, { left: size * 0.71, top: size * 0.54, width: stroke * 1.5, height: stroke * 1.5 }]} />
    </>;
  } else if (name === 'settings') {
    const teeth = [
      { left: 0.43, top: 0.03, width: 0.14, height: 0.3, rotate: '0deg' },
      { left: 0.43, top: 0.67, width: 0.14, height: 0.3, rotate: '0deg' },
      { left: 0.03, top: 0.43, width: 0.3, height: 0.14, rotate: '0deg' },
      { left: 0.67, top: 0.43, width: 0.3, height: 0.14, rotate: '0deg' },
      { left: 0.16, top: 0.15, width: 0.25, height: 0.14, rotate: '45deg' },
      { left: 0.59, top: 0.15, width: 0.25, height: 0.14, rotate: '-45deg' },
      { left: 0.16, top: 0.71, width: 0.25, height: 0.14, rotate: '-45deg' },
      { left: 0.59, top: 0.71, width: 0.25, height: 0.14, rotate: '45deg' },
    ];
    shape = <>
      {teeth.map((tooth, index) => (
        <View key={index} style={[base, { left: size * tooth.left, top: size * tooth.top, width: size * tooth.width, height: size * tooth.height, borderRadius: size * 0.04, transform: [{ rotate: tooth.rotate }] }]} />
      ))}
      <View style={[frame, { left: size * 0.21, top: size * 0.21, width: size * 0.58, height: size * 0.58, borderRadius: size }]} />
      <View style={[frame, { left: size * 0.39, top: size * 0.39, width: size * 0.22, height: size * 0.22, borderRadius: size }]} />
    </>;
  } else if (name === 'clinic') {
    shape = <>
      <View style={[base, { left: size * 0.42, top: size * 0.12, width: size * 0.16, height: size * 0.76 }]} />
      <View style={[base, { left: size * 0.12, top: size * 0.42, width: size * 0.76, height: size * 0.16 }]} />
    </>;
  } else if (name === 'home') {
    shape = <>
      <View style={[base, { left: size * 0.13, top: size * 0.32, width: size * 0.48, height: stroke, transform: [{ rotate: '-42deg' }] }]} />
      <View style={[base, { right: size * 0.13, top: size * 0.32, width: size * 0.48, height: stroke, transform: [{ rotate: '42deg' }] }]} />
      <View style={[frame, { left: size * 0.22, top: size * 0.43, width: size * 0.56, height: size * 0.46, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]} />
      <View style={[frame, { left: size * 0.43, top: size * 0.63, width: size * 0.16, height: size * 0.26, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} />
    </>;
  } else if (name === 'profile') {
    shape = <>
      <View style={[frame, { left: size * 0.06, top: size * 0.06, width: size * 0.88, height: size * 0.88, borderRadius: size }]} />
      <View style={[base, { left: size * 0.4, top: size * 0.25, width: size * 0.2, height: size * 0.2, borderRadius: size }]} />
      <View style={[base, { left: size * 0.27, top: size * 0.56, width: size * 0.46, height: size * 0.2, borderTopLeftRadius: size * 0.25, borderTopRightRadius: size * 0.25, borderBottomLeftRadius: size * 0.1, borderBottomRightRadius: size * 0.1 }]} />
    </>;
  } else if (name === 'bell') {
    shape = <>
      <View style={[frame, { left: size * 0.25, top: size * 0.13, width: size * 0.5, height: size * 0.58, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, borderBottomWidth: 0 }]} />
      <View style={[base, { left: size * 0.16, top: size * 0.69, width: size * 0.68, height: stroke }]} />
      <View style={[base, { left: size * 0.43, top: size * 0.8, width: size * 0.14, height: size * 0.11 }]} />
    </>;
  } else {
    shape = <View style={[frame, { left: size * 0.15, top: size * 0.15, width: size * 0.7, height: size * 0.7 }]} />;
  }

  return <View accessible={false} style={{ width: size, height: size }}>{shape}</View>;
}
