import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageSEO {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
}

const ROUTE_SEO: Record<string, PageSEO> = {
  '/': {
    title: 'Electric Coconut Scrapper & Scraper Machine | Waves and Wires Technologies Official',
    description:
      'Buy India\'s top-rated Waves and Wires Electric Coconut Scrapper (Model M01). 150W high-torque motor, food-grade SS 304 stainless steel blades, heavy-duty vacuum lock base & 1-year warranty. Fast delivery & COD across India.',
    keywords:
      'coconut, scrapper, coconut scrapper, coconut scraper, electric coconut scrapper, coconut scrapper machine, electric coconut scraper, automatic coconut scrapper, coconut grater, coconut grater machine, electric coconut grater, coconut shredder, electric coconut shredder machine, waves and wires, waves and wires coconut scrapper, buy coconut scrapper online, coconut scrapper price in india, best coconut scrapper',
    canonicalPath: '/',
  },
  '/product/electric-coconut-scraper': {
    title: 'Electric Coconut Scrapper & Grater Machine (Model M01) – Waves and Wires',
    description:
      'Order the official Waves and Wires Electric Coconut Scrapper (Model M01). 150W motor, 1000 RPM, food-grade stainless steel blade, vacuum suction base, 1-year warranty. Pan-India delivery.',
    keywords:
      'electric coconut scrapper, electric coconut scraper, coconut scrapper machine, automatic coconut grater, coconut shredder, waves and wires',
    canonicalPath: '/product/electric-coconut-scraper',
  },
  '/product/electric-coconut-scraper-pro': {
    title: 'Electric Coconut Scrapper & Grater Machine (Model M01) – Waves and Wires',
    description:
      'Order the official Waves and Wires Electric Coconut Scrapper (Model M01). 150W motor, 1000 RPM, food-grade stainless steel blade, vacuum suction base, 1-year warranty. Pan-India delivery.',
    keywords:
      'electric coconut scrapper, electric coconut scraper, coconut scrapper machine, automatic coconut grater, coconut shredder, waves and wires',
    canonicalPath: '/product/electric-coconut-scraper',
  },
  '/shop': {
    title: 'Shop – Waves and Wires Technologies',
    description:
      'Explore modern electric kitchen appliances including Electric Coconut Scrapers, Hand Blenders, and Hot Water Bags by Waves and Wires Technologies LLP.',
    canonicalPath: '/shop',
  },
  '/product-category/coconut-scraper': {
    title: 'Coconut Scraper – Waves and Wires Technologies',
    description:
      'Shop official Waves and Wires Electric Coconut Scrapers and replacement stainless steel rotary blades with fast pan-India delivery.',
    canonicalPath: '/product-category/coconut-scraper',
  },
  '/product-category/uncategorized': {
    title: 'Products – Waves and Wires Technologies',
    description:
      'Browse household and kitchen electric appliances from Waves and Wires Technologies LLP.',
    canonicalPath: '/product-category/uncategorized',
  },
  '/about': {
    title: 'About Us – Waves and Wires Technologies',
    description:
      'Waves and Wires Technologies LLP, established on October 10, 2017 in Mumbai, specializes in modern electric appliances including electric coconut scrapers, hand blenders, and hot water bags.',
    canonicalPath: '/about-us',
  },
  '/about-us': {
    title: 'About Us – Waves and Wires Technologies',
    description:
      'Waves and Wires Technologies LLP, established on October 10, 2017 in Mumbai, specializes in modern electric appliances including electric coconut scrapers, hand blenders, and hot water bags.',
    canonicalPath: '/about-us',
  },
  '/contact': {
    title: 'Contact Us – Waves and Wires Technologies',
    description:
      'Contact Waves and Wires Technologies LLP at Jesal Park, Bhayandar East, Mumbai - 401105. Reach our Corporate Support & Sales Department.',
    canonicalPath: '/contact',
  },
  '/contact-us': {
    title: 'Contact Us – Waves and Wires Technologies',
    description:
      'Contact Waves and Wires Technologies LLP at Jesal Park, Bhayandar East, Mumbai - 401105. Reach our Corporate Support & Sales Department.',
    canonicalPath: '/contact',
  },
  '/privacy-policy': {
    title: 'Privacy Policy – Waves and Wires Technologies',
    description:
      'Read the official Privacy Policy of Waves and Wires Technologies LLP (wavesandwires.in).',
    canonicalPath: '/privacy-policy',
  },
  '/refund-and-returns-policy': {
    title: 'Return & Refund Policy – Waves and Wires Technologies',
    description:
      'Review our 7-day Return & Refund Policy at Waves and Wires Technologies LLP for a hassle-free shopping experience.',
    canonicalPath: '/refund-and-returns-policy',
  },
  '/return-policy': {
    title: 'Return & Refund Policy – Waves and Wires Technologies',
    description:
      'Review our 7-day Return & Refund Policy at Waves and Wires Technologies LLP for a hassle-free shopping experience.',
    canonicalPath: '/refund-and-returns-policy',
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions – Waves and Wires Technologies',
    description:
      'Read the official Terms & Conditions for purchasing appliances from Waves and Wires Technologies LLP.',
    canonicalPath: '/terms-and-conditions',
  },
  '/terms-of-service': {
    title: 'Terms & Conditions – Waves and Wires Technologies',
    description:
      'Read the official Terms & Conditions for purchasing appliances from Waves and Wires Technologies LLP.',
    canonicalPath: '/terms-and-conditions',
  },
  '/shipping-rates-and-policies': {
    title: 'Shipping Rates & Policies – Waves and Wires Technologies',
    description:
      'Shipping, delivery, and return policies for Waves and Wires Technologies LLP orders across India.',
    canonicalPath: '/shipping-rates-and-policies',
  },
  '/help-center': {
    title: 'Help Center & FAQs – Waves and Wires Technologies',
    description:
      'Find answers to common questions about Waves and Wires Electric Coconut Scraper orders, warranty, shipping, and returns.',
    canonicalPath: '/help-center',
  },
  '/blog': {
    title: 'Blog – Waves and Wires Technologies',
    description:
      'Kitchen tips, coconut recipes, and appliance buying guides from Waves and Wires Technologies LLP.',
    canonicalPath: '/blog',
  },
  '/careers': {
    title: 'Careers – Waves and Wires Technologies',
    description:
      'Join the team at Waves and Wires Technologies LLP in Mumbai.',
    canonicalPath: '/careers',
  },
  '/order-tracking': {
    title: 'Order Tracking – Waves and Wires Technologies',
    description:
      'Track your Waves and Wires appliance order status in real time.',
    canonicalPath: '/order-tracking',
  },
};

export default function SEOHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    const seo = ROUTE_SEO[cleanPath] || {
      title: 'Waves and Wires Technologies – Official Store',
      description:
        'Shop Electric Coconut Scrapers and modern kitchen appliances from Waves and Wires Technologies LLP. Free delivery & 1-Year Warranty.',
      canonicalPath: cleanPath,
    };

    document.title = seo.title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', seo.description);
    if (seo.keywords) {
      setMeta('meta[name="keywords"]', 'content', seo.keywords);
    }
    setMeta('meta[property="og:title"]', 'content', seo.title);
    setMeta('meta[property="og:description"]', 'content', seo.description);
    setMeta(
      'meta[property="og:url"]',
      'content',
      `https://wavesandwires.in${seo.canonicalPath === '/' ? '/' : seo.canonicalPath}`
    );
    setMeta(
      'link[rel="canonical"]',
      'href',
      `https://wavesandwires.in${seo.canonicalPath === '/' ? '/' : seo.canonicalPath}`
    );
  }, [pathname]);

  return null;
}
