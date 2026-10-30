export const keys = {
  me: ['me'] as const,
  sounds: ['sounds'] as const,
  scenes: ['scenes'] as const,
  scene: (id: string) => ['scenes', id] as const,
  favourites: ['favourites'] as const,
  pads: ['pads'] as const,
  recent: ['recent'] as const,
}
