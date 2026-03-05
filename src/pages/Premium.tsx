import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Binary,
  Brain,
  Database,
  Globe,
  Lock,
  Zap,
  CheckCircle2,
  FileText,
  Cpu,
  Network,
  Shield,
  Lightbulb,
  Search,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Premium = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as any },
    },
  } as any;

  const capabilitiesData = [
    {
      icon: Brain,
      title: 'Intelligent Analysis',
      description: 'AI-powered binary analysis with deep learning pattern recognition and anomaly detection.',
      link: '#',
    },
    {
      icon: Globe,
      title: 'Network Inspection',
      description: 'Advanced PCAP parsing and protocol dissection across 250+ formats and standards.',
      link: '#',
    },
    {
      icon: Shield,
      title: 'Secure Operations',
      description: 'Enterprise-grade security with sandboxed execution and comprehensive audit trails.',
      link: '#',
    },
  ];

  const statsData = [
    { number: '10M+', label: 'Bytes Analyzed Daily', icon: Database },
    { number: '250+', label: 'Supported Formats', icon: FileText },
    { number: '99.9%', label: 'Uptime SLA', icon: TrendingUp },
    { number: '24/7', label: 'Expert Support', icon: Zap },
  ];

  const caseStudies = [
    {
      company: 'Global Security Firm',
      title: 'Reduced analysis time by 80%',
      description: 'Enterprise security operations accelerated binary forensics workflow.',
      icon: Shield,
    },
    {
      company: 'Financial Services',
      title: 'Automated compliance checks',
      description: 'Streamlined regulatory validation and audit trail generation.',
      icon: CheckCircle2,
    },
    {
      company: 'Research Institution',
      title: 'Scaled to 500+ formats',
      description: 'Researchers expanded file format analysis capabilities tenfold.',
      icon: Brain,
    },
    {
      company: 'DevOps Platform',
      title: 'Integrated into CI/CD',
      description: 'Automated binary integrity validation on every build cycle.',
      icon: Network,
    },
  ];

  const features = [
    { icon: Lock, title: 'Zero Trust Security', desc: 'Sandboxed execution with complete isolation' },
    { icon: Brain, title: 'ML-Powered Detection', desc: 'Advanced pattern recognition and anomalies' },
    { icon: Network, title: 'Network Analysis', desc: 'PCAP inspection and protocol dissection' },
    { icon: Database, title: 'Enterprise Scale', desc: '10M+ bytes per day, zero performance hit' },
    { icon: TrendingUp, title: 'Real-time Performance', desc: 'Sub-millisecond analysis latency' },
    { icon: Lightbulb, title: 'AI Insights', desc: 'Intelligent suggestions and recommendations' },
  ];

  const newsData = [
    { category: 'Release', title: 'v2.0 launches with AI co-pilot', date: 'March 2026' },
    { category: 'Feature', title: 'Real-time network capture', date: 'February 2026' },
    { category: 'Research', title: 'New ML malware models', date: 'January 2026' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif" }}>
      {/* Navigation */}
      <nav className="border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <Binary className="w-5 h-5 text-white font-bold" />
            </div>
            <span className="font-bold text-xl text-slate-900" style={{ fontWeight: 700, letterSpacing: '-0.3px' }}>Binary Insight</span>
          </motion.div>

          {/* Desktop Nav */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-6"
          >
            <a href="#features" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Features</a>
            <a href="#use-cases" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">Use Cases</a>
            <a href="#news" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">News</a>
            <Button
              onClick={() => navigate('/app')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium"
            >
              Launch App
            </Button>
          </motion.div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 px-6 space-y-3">
            <a href="#features" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Features</a>
            <a href="#use-cases" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Use Cases</a>
            <a href="#news" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">News</a>
            <Button
              onClick={() => navigate('/app')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Launch App
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Enterprise Binary Intelligence Platform</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="text-6xl lg:text-7xl font-bold mb-6 leading-tight text-slate-900"
              style={{ fontWeight: 700, letterSpacing: '-1px' }}
            >
              Binary Intelligence
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Understood Everywhere</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl font-light"
            >
              Scale intelligent binary analysis, network inspection, and security research with our unified enterprise platform. Analyze any file, decode any protocol, protect what matters most.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={() => navigate('/app')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base rounded-lg font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                className="bg-white border-2 border-slate-300 hover:border-blue-600 text-slate-900 hover:text-blue-600 px-8 py-3 text-base rounded-lg font-semibold transition-all"
              >
                Schedule Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted Section */}
      <section className="py-16 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-slate-600 font-semibold text-sm tracking-wide uppercase mb-8">
            Trusted by Fortune 500 Companies
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 hover:bg-slate-200 transition">
                  <Cpu className="w-7 h-7 text-slate-400" />
                </div>
                <div className="text-xs text-slate-500 font-semibold">Enterprise {i + 1}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-24 md:py-32 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-16">
            <h2 className="text-5xl font-bold mb-4 text-slate-900" style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
              Core Capabilities
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl font-light">
              Three pillars combining advanced technology, enterprise reliability, and human expertise to deliver unmatched analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {capabilitiesData.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="group p-10 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:bg-blue-50/40 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                  <cap.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900" style={{ fontWeight: 700 }}>
                  {cap.title}
                </h3>
                <p className="text-slate-600 mb-5 leading-relaxed font-light">{cap.description}</p>
                <a href={cap.link} className="text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-16">
            <h2 className="text-5xl font-bold mb-4 text-slate-900" style={{ fontWeight: 700 }}>
              Why Choose Binary Insight?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1" style={{ fontWeight: 700 }}>
                  {stat.number}
                </div>
                <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-24 md:py-32 bg-white" id="use-cases">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-16">
            <h2 className="text-5xl font-bold mb-4 text-slate-900" style={{ fontWeight: 700 }}>
              Trusted by the Best
            </h2>
            <p className="text-xl text-slate-600 font-light">
              Industry leaders use Binary Insight to accelerate their analysis and security workflows.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {caseStudies.map((study, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <study.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{study.company}</div>
                    <div className="text-xs text-slate-500">Enterprise Customer</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900" style={{ fontWeight: 700 }}>
                  {study.title}
                </h3>
                <p className="text-slate-600 font-light">{study.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-16">
            <h2 className="text-5xl font-bold mb-4 text-slate-900" style={{ fontWeight: 700 }}>
              Enterprise Features
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-6 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1" style={{ fontWeight: 700 }}>
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm font-light">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-24 md:py-32 bg-white" id="news">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-16 flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-bold mb-4 text-slate-900" style={{ fontWeight: 700 }}>
                Latest Updates
              </h2>
            </div>
            <Button variant="outline" className="border-slate-300 text-slate-900 hover:bg-slate-50">
              View All
            </Button>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {newsData.map((news, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {news.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{news.date}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900" style={{ fontWeight: 700 }}>
                  {news.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="text-5xl font-bold mb-4 text-white" style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
              Ready to Transform Your Analysis?
            </h2>
            <p className="text-xl text-blue-100 mb-10 font-light">
              Join leading enterprises accelerating their binary analysis and security workflows today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/app')}
                className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-3 text-base rounded-lg font-semibold"
              >
                Get Started Free
              </Button>
              <Button
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-base rounded-lg font-semibold"
              >
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Binary className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Binary Insight</span>
              </div>
              <p className="text-sm font-light">Enterprise binary intelligence platform for the modern security team.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm font-light">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex items-center justify-between text-sm font-light">
            <p>&copy; 2026 Binary Insight. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Premium;
