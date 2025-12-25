// Remote image URLs for the app
// Using free stock images from Unsplash for visual appeal

export const images = {
  // Backgrounds
  loginBackground: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
  dashboardHero: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',

  // Weather backgrounds
  weatherSunny: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=400&q=80',
  weatherCloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&q=80',
  weatherRainy: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&q=80',

  // Vehicle related
  carInspection: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
  carDashboard: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
  carEngine: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
  carExterior: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80',

  // Avatars
  defaultAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  dispatcherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',

  // Icons/Illustrations
  emptyState: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=400&q=80',
  successCheck: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80',

  // Map placeholder
  mapPlaceholder: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80',
};

// Lottie animation URLs (for future use)
export const animations = {
  loading: 'https://assets5.lottiefiles.com/packages/lf20_usmfx6bp.json',
  success: 'https://assets5.lottiefiles.com/packages/lf20_jbrw3hcz.json',
  empty: 'https://assets5.lottiefiles.com/packages/lf20_hl5n0bwb.json',
  car: 'https://assets5.lottiefiles.com/packages/lf20_2omr5gpu.json',
};

// Status icons with colors
export const statusIcons = {
  AVAILABLE: { icon: 'checkmark-circle', color: '#10B981' },
  BUSY: { icon: 'time', color: '#F59E0B' },
  OFFLINE: { icon: 'close-circle', color: '#6B7280' },
};

// Weather icons mapping
export const weatherIcons: { [key: string]: string } = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  rainy: 'rainy',
  stormy: 'thunderstorm',
  snowy: 'snow',
  clear: 'moon',
};
