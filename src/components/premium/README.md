# 🔥 Premium UI Components

Battle-tested, production-ready React Native components for high-end mobile apps.

## 🌟 Components

### AnimatedGradientBorder

The ultimate animated gradient border component for React Native. Creates a smooth traveling spotlight effect around any content.

**🎯 Perfect for:**
- Loading states with premium feel
- Active/selected indicators  
- High-end app UI polish
- Gaming UI effects
- Premium subscription indicators

**✅ Features:**
- Smooth 60fps perimeter traveling animation
- Intelligent dark mode support
- Perfect clipping masks (no zIndex hell)
- TypeScript support
- Color matching with parent backgrounds
- Debug mode for troubleshooting

## 🚀 Quick Start

```tsx
import { AnimatedGradientBorder } from './components/premium';

<AnimatedGradientBorder isActive={isLoading}>
  <YourContent />
</AnimatedGradientBorder>
```

## 📚 Full Documentation

See `AnimatedGradientBorder.tsx` for complete API documentation and usage examples.

## 🎨 Examples

See `AnimatedGradientBorder.examples.tsx` for:
- Basic usage
- Loading cards
- Custom gradients
- Gaming UI effects
- Premium gold styling

## 🛠️ Development

### Adding New Premium Components

1. Create your component in this folder
2. Export it from `index.ts`
3. Add examples in a `.examples.tsx` file
4. Update this README

### Code Style

- Use TypeScript with full type safety
- Include comprehensive JSDoc comments
- Add debug props for troubleshooting
- Follow the existing naming conventions
- Include usage examples in comments

## 📈 Performance

All components are optimized for production:
- Minimal re-renders with `useRef`
- GPU-accelerated animations where possible
- Memory-efficient cleanup
- 60fps target performance

---

*Built with ❤️ by the Numina AI team*