// Web Performance Monitoring for Numina Web

export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bundleSize: number;
  networkLatency: number;
}

export interface ComponentMetrics {
  renderTime: number;
  rerenderCount: number;
  memoryUsage: number;
  componentName: string;
}

class WebPerformanceService {
  private static instance: WebPerformanceService;
  private metrics: Partial<PerformanceMetrics> = {};
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private observer: PerformanceObserver | null = null;

  private constructor() {
    this.initializeObserver();
    this.measurePageLoad();
  }

  static getInstance(): WebPerformanceService {
    if (!WebPerformanceService.instance) {
      WebPerformanceService.instance = new WebPerformanceService();
    }
    return WebPerformanceService.instance;
  }

  private initializeObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe all performance entry types
      this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
        break;

      case 'largest-contentful-paint':
        this.metrics.largestContentfulPaint = entry.startTime;
        break;

      case 'layout-shift':
        const layoutShiftEntry = entry as any;
        this.metrics.cumulativeLayoutShift = 
          (this.metrics.cumulativeLayoutShift || 0) + layoutShiftEntry.value;
        break;

      case 'first-input':
        const firstInputEntry = entry as any;
        this.metrics.firstInputDelay = firstInputEntry.processingStart - firstInputEntry.startTime;
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.navigationStart;
        this.metrics.timeToInteractive = navEntry.domInteractive - navEntry.navigationStart;
        break;
    }
  }

  private measurePageLoad() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      // Measure bundle size
      this.measureBundleSize();
      
      // Measure network latency
      this.measureNetworkLatency();

      // Report core web vitals
      setTimeout(() => {
        this.reportCoreWebVitals();
      }, 1000);
    });
  }

  private measureBundleSize() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.transferSize) {
        this.metrics.bundleSize = connection.transferSize;
      }
    }
  }

  private measureNetworkLatency() {
    const startTime = performance.now();
    
    fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache' 
    })
      .then(() => {
        this.metrics.networkLatency = performance.now() - startTime;
      })
      .catch(() => {
        // Fallback latency measurement
        this.metrics.networkLatency = -1;
      });
  }

  private reportCoreWebVitals() {
    console.log('🚀 Numina Web Performance Metrics:', this.metrics);
    
    // Report to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const gtag = (window as any).gtag;
      
      Object.entries(this.metrics).forEach(([metric, value]) => {
        if (typeof value === 'number' && value > 0) {
          gtag('event', 'web_vitals', {
            metric_name: metric,
            metric_value: value,
            custom_parameter: 'numina_web'
          });
        }
      });
    }
  }

  // Component performance tracking
  measureComponentRender(componentName: string, renderFn: () => any) {
    const startTime = performance.now();
    const result = renderFn();
    const renderTime = performance.now() - startTime;

    const existing = this.componentMetrics.get(componentName);
    this.componentMetrics.set(componentName, {
      componentName,
      renderTime,
      rerenderCount: existing ? existing.rerenderCount + 1 : 1,
      memoryUsage: this.getMemoryUsage(),
    });

    // Log slow renders
    if (renderTime > 16) { // Slower than 60fps
      console.warn(`⚠️ Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    return result;
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  // React DevTools integration
  profileComponent(componentName: string) {
    return {
      onRender: (id: string, phase: 'mount' | 'update', actualDuration: number) => {
        const existing = this.componentMetrics.get(componentName);
        this.componentMetrics.set(componentName, {
          componentName,
          renderTime: actualDuration,
          rerenderCount: existing ? existing.rerenderCount + 1 : 1,
          memoryUsage: this.getMemoryUsage(),
        });
      }
    };
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > 2500) {
      suggestions.push('🎨 First Contentful Paint is slow - consider code splitting');
    }
    
    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 4000) {
      suggestions.push('🖼️ Largest Contentful Paint is slow - optimize images and critical CSS');
    }
    
    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.1) {
      suggestions.push('📐 High Cumulative Layout Shift - add explicit dimensions to images/content');
    }
    
    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      suggestions.push('⚡ First Input Delay is high - reduce JavaScript execution time');
    }

    // Check component performance
    for (const [name, metrics] of this.componentMetrics.entries()) {
      if (metrics.rerenderCount > 100) {
        suggestions.push(`🔄 ${name} re-renders frequently - consider React.memo or useMemo`);
      }
      if (metrics.renderTime > 50) {
        suggestions.push(`🐌 ${name} renders slowly - optimize component logic`);
      }
    }

    return suggestions;
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  // Resource loading optimization
  preloadCriticalResources(resources: string[]) {
    if (typeof document === 'undefined') return;

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }

  // Lazy loading helper
  createIntersectionObserver(callback: IntersectionObserverCallback) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });
  }

  // Cleanup
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export default WebPerformanceService;