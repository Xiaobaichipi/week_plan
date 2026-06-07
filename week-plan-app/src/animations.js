/**
 * GSAP 动画集合
 * 克制风格：duration ≤ 0.4s，Power2.easeOut / Power3.easeInOut
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS = {
  ease: 'power2.out',
  duration: 0.3,
};

/**
 * 页面入场动画：7 天卡片 stagger 淡入
 * @param {string|Element} selector
 */
export function animateTimeGridEntrance(selector = '.day-card') {
  return gsap.from(selector, {
    opacity: 0,
    y: 24,
    duration: 0.35,
    stagger: 0.06,
    ease: 'power2.out',
  });
}

/**
 * 翻页过渡：内容区淡出→更新→淡入
 * @param {Element} container 内容容器
 */
export function animatePageTransition(container) {
  if (!container) return;
  return gsap.fromTo(container, {
    opacity: 0,
    y: 12,
  }, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: 'power2.out',
  });
}

/**
 * ScrollTrigger 滚动入场
 * @param {string|Element} selector
 */
export function animateScrollReveal(selector = '.section') {
  return gsap.from(selector, {
    opacity: 0,
    y: 20,
    duration: 0.35,
    stagger: 0.08,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: selector,
      start: 'top 85%',
      toggleActions: 'play none none none',
    },
  });
}

/**
 * 抽屉打开动画
 * @param {boolean} opening
 */
export function animateDrawer(opening) {
  // Drawer transform 用 CSS transition，这里主要做 overlay
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) {
    gsap.to(overlay, {
      opacity: opening ? 1 : 0,
      duration: 0.25,
      ease: 'power2.out',
    });
  }
}

/**
 * Modal 弹入
 * @param {Element} modal
 */
export function animateModalIn(modal) {
  if (!modal) return;
  return gsap.fromTo(modal, {
    opacity: 0,
    scale: 0.96,
    y: 10,
  }, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.25,
    ease: 'power3.out',
  });
}

/**
 * 任务勾选划线动画
 * @param {Element} textEl 文本元素
 * @param {boolean} done
 */
export function animateTaskToggle(textEl, done) {
  if (done) {
    gsap.fromTo(textEl, {
      textDecoration: 'none',
      color: 'var(--color-body)',
    }, {
      textDecoration: 'line-through',
      color: 'var(--color-muted-soft)',
      duration: 0.2,
      ease: 'power2.out',
    });
  } else {
    gsap.fromTo(textEl, {
      textDecoration: 'line-through',
      color: 'var(--color-muted-soft)',
    }, {
      textDecoration: 'none',
      color: 'var(--color-body)',
      duration: 0.2,
      ease: 'power2.out',
    });
  }
}

/**
 * 任务项移除动画
 * @param {Element} itemEl
 * @returns {Promise}
 */
export function animateTaskRemove(itemEl) {
  return gsap.to(itemEl, {
    opacity: 0,
    x: -20,
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    duration: 0.25,
    ease: 'power2.inOut',
  });
}

/**
 * Hover 微动效：卡片上浮
 * @param {Element} el
 */
export function animateCardHover(el) {
  el.addEventListener('mouseenter', () => {
    gsap.to(el, { y: -2, duration: 0.2, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { y: 0, duration: 0.2, ease: 'power2.out' });
  });
}

/**
 * 清理所有 ScrollTrigger
 */
export function killAllScrollTriggers() {
  ScrollTrigger.getAll().forEach(st => st.kill());
}
